import * as React from 'react';
import _ from 'lodash';
import { VPage, Page, Form, Schema, UiSchema, Context, UiInputItem, UiIdItem, BoxId } from 'tonva';
import { tv } from 'tonva';
import { CSelectContact } from './CSelectContact';
import { addressDetailValidation, emailValidation, telephoneValidation, mobileValidation, organizationNameValidation, nameValidation } from 'tools/inputValidations';

const schema: Schema = [
    { name: 'id', type: 'id', required: false },
    { name: 'name', type: 'string', required: true },
    { name: 'organizationName', type: 'string', required: true },
    { name: 'mobile', type: 'string', required: true },
    { name: 'telephone', type: 'string', required: false },
    { name: 'email', type: 'string', required: false },
    { name: 'address', type: 'id', required: true },
    { name: 'addressString', type: 'string', required: true },
    { name: 'isDefault', type: 'boolean', required: false },
];

export class VContact extends VPage<CSelectContact> {

    private userContactData: any;
    private form: Form;

    private uiSchema: UiSchema = {
        items: {
            id: { visible: false },
            name: { widget: 'text', label: '姓名', placeholder: '姓名', rules: nameValidation } as UiInputItem,
            organizationName: { widget: 'text', label: '单位名称', placeholder: '单位名称', rules: organizationNameValidation } as UiInputItem,
            mobile: { widget: 'text', label: '手机号', placeholder: '手机号', rules: mobileValidation } as UiInputItem, telephone: { widget: 'text', label: '电话', placeholder: '电话', rules: telephoneValidation } as UiInputItem,
            email: { widget: 'email', label: 'Email', rules: emailValidation, placeholder: 'Email' } as UiInputItem,
            address: {
                widget: 'id', label: '所在地区', placeholder: '所在地区',
                pickId: async (context: Context, name: string, value: number) => await this.controller.pickAddress(context, name, value),
                Templet: (address: BoxId) => {
                    return tv(address, (addressValue) => {
                        let { country, province, city, county } = addressValue;
                        /* 下面这种在使用tv之前的一堆判断应该是tv或者什么的有bug, 应该让Henry改改 */
                        return <div className="text-truncate">
                            {country && country.id && tv(country, v => <>{v.chineseName}</>)}
                            {province && province.id && tv(province, (v) => <>{v.chineseName}</>)}
                            {city && city.id && tv(city, (v) => <>{v.chineseName}</>)}
                            {county && county.id && tv(county, (v) => <>{v.chineseName}</>)}
                        </div>;
                    }, () => {
                        return <small className="text-muted">请选择地区</small>;
                    })
                }
            } as UiIdItem,
            addressString: { widget: 'text', label: '详细地址', placeholder: '详细地址', className: "text-truncate", rules: addressDetailValidation } as UiInputItem,
            isDefault: { widget: 'checkbox', label: '作为默认地址' },
            submit: { widget: 'button', label: '提交' },
        }
    }

    async open(userContactData: any) {
        this.userContactData = userContactData;
        this.openPage(this.page);
    }

    private onSaveContact = async () => {
        if (!this.form) return;
        await this.form.buttonClick("submit");
    }

    private onFormButtonClick = async (name: string, context: Context) => {
        await this.controller.saveContact(context.form.data);
    }

    private onDelContact = async () => {
        let { contact } = this.userContactData;
        if (await this.vCall(VConfirmDeleteContact, contact) === true) {
            await this.controller.delContact(contact);
            this.closePage();
        };
    }

    private page = () => {
        let contactData = _.clone(this.userContactData.contact);

        let buttonDel: any;
        if (contactData !== undefined) {
            buttonDel = <button className="btn btn-sm btn-info" onClick={this.onDelContact}>删除</button>;
        } else {
            let { defaultOrganizationName, defaultName, defaultMobile, address, addressString } = this.controller.cApp.currentUser;
            contactData = {
                'organizationName': defaultOrganizationName,
                'name': defaultName,
                'mobile': defaultMobile,
                'address': address,
                'addressString': addressString
            };
        }
        let { fromOrderCreation } = this.controller;
        let footer = <button type="button"
            className="btn btn-primary w-100"
            onClick={this.onSaveContact}>{fromOrderCreation ? '保存并使用' : '保存'}</button>;
        return <Page header="地址信息" footer={footer} right={buttonDel}>
            <div className="App-container container text-left">
                <Form ref={v => this.form = v} className="my-3"
                    schema={schema}
                    uiSchema={this.uiSchema}
                    formData={contactData}
                    onButtonClick={this.onFormButtonClick}
                    fieldLabelSize={3} />
            </div>
        </Page>
    }
}

class VConfirmDeleteContact extends VPage<CSelectContact> {
    async open(contact: any) {
        this.openPage(this.page, contact);
    }

    private onConfirm = async () => {
        await this.returnCall(true);
        this.closePage();
    }

    private onCancel = async () => {
        await this.returnCall(false);
        this.closePage();
    }

    private page = (contact: any) => {
        return <Page header="删除地址" back="close">
            <div className="w-75 mx-auto border border-primary rounded my-3 p-3 bg-white">
                <div className="p-4 position-relative">
                    <i className="fa fa-question-circle position-absolute fa-2x text-warning" style={{ left: 0, top: 0 }} />
                    <b className="">是否删除该地址？</b>
                </div>
                <div className="d-flex mt-3 justify-content-end">
                    <button className="btn btn-danger mr-3" onClick={this.onConfirm}>删除地址</button>
                    <button className="btn btn-outline-info mr-3" onClick={this.onCancel}>取消</button>
                </div>
            </div>
        </Page>;
    }
}
