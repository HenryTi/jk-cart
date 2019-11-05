import { User, loadAppUqs } from 'tonva';
import { Map, BoxId, CUq, Tuid } from 'tonva';
import { observable, computed } from 'mobx';
import { UQs } from './uqs';

export class WebUser {

    id: number;
    name: string;
    nick?: string;
    icon?: string;
    guest: number;
    token: string;

    @observable firstName: string;
    gender: string;
    salutation: string;
    @observable organizationName: string;
    departmentName: string;

    get defaultOrganizationName(): string {
        return this.organizationName ||
            (this.webUserSettings &&
                (
                    (this.webUserSettings.invoiceInfo && this.webUserSettings.invoiceInfo.obj['title'])
                    || (this.webUserSettings.shippingContact && this.webUserSettings.shippingContact.obj['organizationName'])
                    || (this.webUserSettings.invoiceContact && this.webUserSettings.invoiceContact.obj['organizationName'])
                )
            );
    }

    get defaultName(): string {
        return this.firstName ||
            (this.webUserSettings &&
                ((
                    this.webUserSettings.shippingContact && this.webUserSettings.shippingContact.obj['name'])
                    || (this.webUserSettings.invoiceContact && this.webUserSettings.invoiceContact.obj['name'])
                )
            );
    }

    get defaultMobile(): string {
        return this.mobile ||
            (this.webUserSettings &&
                ((
                    this.webUserSettings.shippingContact && this.webUserSettings.shippingContact.obj['mobile'])
                    || (this.webUserSettings.invoiceContact && this.webUserSettings.invoiceContact.obj['mobile'])
                )
            );
    }

    telephone: string;
    @observable mobile: string;
    email: string;
    fax: string;
    address: BoxId;
    addressString: string;
    zipCode: string;
    @computed get allowOrdering() {
        return this.currentCustomer !== undefined ||
            (this.mobile && this.firstName && this.organizationName);
    }

    private _user: User;

    private webUserSettings: any;

    private uqs: UQs;


    constructor(uqs: UQs) {// cUsqWebUser: CUq, cUsqCustomer: CUq) {
        this.uqs = uqs;
    }

    setUser = async (user: User) => {
        if (user !== undefined) {
            this._user = user;
            this.id = user.id;
            this.name = user.name;
            this.nick = user.nick;
            this.icon = user.icon;
            this.guest = user.guest;
            this.token = user.token;

            await this.loadWebUser();
        }
    }

    private async loadWebUser() {
        let { id, _user } = this;
        if (this._user !== undefined) {
            let webUser = await this.uqs.webuser.WebUser.load(this.id);
            if (webUser) {
                let { firstName, gender, salutation, organizationName, departmentName } = webUser;
                this.firstName = firstName;
                this.gender = gender;
                this.salutation = salutation;
                this.organizationName = organizationName;
                this.departmentName = departmentName;
            }
            let contact = await this.uqs.webuser.WebUserContact.obj({ "webUser": id });
            if (contact) {
                let { telephone, mobile, email, fax, address, addressString, zipCode } = contact;
                this.telephone = telephone;
                this.mobile = mobile;
                this.email = email;
                this.fax = fax;
                this.address = address;
                this.addressString = addressString;
                this.zipCode = zipCode;
            }
            this.webUserSettings = await this.uqs.webuser.WebUserSetting.obj({ webUser: id }) || { webUser: id };
            let value = await this.uqs.webuser.WebUserCustomer.obj({ webUser: id });
            if (value !== undefined) {
                this.currentCustomer = new Customer(value.customer, this.uqs);
                await this.currentCustomer.init();
            }
        }
    }

    get isLogined(): boolean {
        return this._user !== undefined;
    }
    get hasCustomer(): boolean {
        return this.currentCustomer !== undefined;
    }
    currentCustomer: Customer;

    async getContacts(): Promise<any[]> {
        /*
        if (this.currentCustomer !== undefined) {
            return await this.currentCustomer.getContacts()
        }
        */
        return await this.uqs.webuser.WebUserContacts.table({ webUser: this.id });
    }

    async addContact(contactId: number) {
        /*
        if (this.currentCustomer !== undefined) {
            await this.currentCustomer.addContact(contactId);
            return;
        }
        */
        await this.uqs.webuser.WebUserContacts.add({ webUser: this.id, arr1: [{ contact: contactId }] });
    }

    async addContactFromAccount() {
        let { firstName, organizationName, mobile, telephone, email, address, addressString } = this;
        if (firstName && organizationName && mobile && address && addressString) {
            let newContact = await this.uqs.customer.Contact.save(undefined, {
                name: firstName,
                organizationName: organizationName,
                mobile: mobile,
                telephone: telephone,
                email: email,
                address: address,
                addressString: addressString
            })
            if (newContact) {
                let { id: newContactId } = newContact;
                await this.addContact(newContactId);
                let newContactBox = this.uqs.customer.Contact.boxId(newContactId);
                this.setDefaultShippingContact(newContactBox);
            }
        }
    }

    async delContact(contactId: number) {
        /*
        if (this.currentCustomer !== undefined) {
            await this.currentCustomer.delContact(contactId);
            return;
        }
        */
        await this.uqs.webuser.WebUserContacts.del({ webUser: this.id, arr1: [{ contact: contactId }] });
    }

    async getSetting() {
        /*
        if (this.currentCustomer !== undefined) {
            return this.currentCustomer.getSetting();
        }
        */
        return this.webUserSettings;
    }

    async setDefaultShippingContact(contactId: BoxId) {
        /*
        if (this.currentCustomer !== undefined) {
            await this.currentCustomer.setDefaultShippingContact(contactId);
            return;
        }
        */
        this.webUserSettings.shippingContact = contactId;
        this.saveDefaultSettings();
    }

    async setDefaultInvoiceContact(contactId: BoxId) {
        /*
        if (this.currentCustomer !== undefined) {
            await this.currentCustomer.setDefaultInvoiceContact(contactId);
            return;
        }
        */
        this.webUserSettings.invoiceContact = contactId;
        this.saveDefaultSettings();
    }

    async setDefaultInvoice(invoiceTypeId: BoxId, invoiceInfoId: BoxId) {
        /*
        if (this.currentCustomer !== undefined) {
            await this.currentCustomer.setDefaultInvoice(invoiceTypeId, invoiceInfoId);
            return;
        }
        */
        // await this.webUserSettingMap.add({ webUser: this.id, arr1: [{ invoiceType: invoiceTypeId, invoiceInfo: invoiceInfoId }] });
        this.webUserSettings.invoiceType = invoiceTypeId;
        this.webUserSettings.invoiceInfo = invoiceInfoId;
        this.saveDefaultSettings();
    }

    async saveDefaultSettings() {
        await this.uqs.webuser.WebUserSetting.add(this.webUserSettings);
    }


    async changeWebUser(webUser: any) {
        await this.uqs.webuser.WebUser.save(this.id, webUser);
        await this.loadWebUser();
    }

    async changeWebUserContact(webUserContact: any) {
        webUserContact.webUser = this.id;
        await this.uqs.webuser.WebUserContact.add(webUserContact);
        await this.loadWebUser();
    }
};

export class Customer {
    private readonly uqs: UQs;
    id: number;

    private customerSettings: any;
    Contractor: any;

    constructor(customer: BoxId, uqs: UQs) {
        this.id = customer.id;
        this.uqs = uqs;
    };

    async getContacts(): Promise<any[]> {
        return await this.uqs.customer.CustomerContacts.table({ customer: this.id });
    }

    async addContact(contactId: number) {
        await this.uqs.customer.CustomerContacts.add({ customer: this.id, arr1: [{ contact: contactId }] });
    }

    async delContact(contactId: number) {
        await this.uqs.customer.CustomerContacts.del({ customer: this.id, arr1: [{ contact: contactId }] });
    }

    async init() {
        this.customerSettings = await this.uqs.customer.CustomerSetting.obj({ customer: this.id }) || { customer: this.id };
        let customerContactorMap: any = await this.uqs.customer.CustomerContacts.obj({ customer: this.id });
        if (customerContactorMap)
            this.Contractor = customerContactorMap.contractor;
    }

    getSetting() {
        return this.customerSettings;
    }

    async setDefaultShippingContact(contactId: BoxId) {
        this.customerSettings.shippingContact = contactId;
        await this.setDefaultSettings();
    }

    async setDefaultInvoiceContact(contactId: BoxId) {
        this.customerSettings.invoiceContact = contactId;
        await this.setDefaultSettings();
    }

    async setDefaultInvoice(invoiceTypeId: BoxId, invoiceInfoId: BoxId) {
        this.customerSettings.invoiceType = invoiceTypeId;
        this.customerSettings.invoiceInfo = invoiceInfoId;
        await this.setDefaultSettings();
    }

    async setDefaultSettings() {
        await this.uqs.customer.CustomerSetting.add(this.customerSettings);
    }
}