import { observable } from 'mobx';
import { BoxId } from 'tonva';
import { nav } from 'tonva';
import { CUqBase } from '../CBase';
import { VCreateOrder } from './VCreateOrder';
import { Order, OrderItem } from './Order';
import { OrderSuccess } from './OrderSuccess';
import { CSelectShippingContact, CSelectInvoiceContact } from '../customer/CSelectContact';
import { VMyOrders } from './VMyOrders';
import { VOrderDetail } from './VOrderDetail';
import { CInvoiceInfo } from '../customer/CInvoiceInfo';
import { groupByProduct } from '../tools/groupByProduct';
import { CartItem2 } from '../cart/Cart';

const FREIGHTFEEFIXED = 12;
const FREIGHTFEEREMITTEDSTARTPOINT = 100;

export class COrder extends CUqBase {
    //    cApp: CApp;
    @observable orderData: Order = new Order();
    @observable couponData: any = {};

    protected async internalStart(param: any) {
        let cart = param;
        await this.createOrderFromCart(cart);
        this.openVPage(VCreateOrder);
    }

    private createOrderFromCart = async (cartItems: CartItem2[]) => {
        let { currentUser, currentSalesRegion, currentCouponCode } = this.cApp;
        this.orderData.webUser = currentUser.id;
        this.orderData.salesRegion = currentSalesRegion.id;
        this.removeCoupon();

        let { currentCustomer } = currentUser;
        if (currentCustomer !== undefined) {
            let { Contractor } = currentCustomer;
            this.orderData.customer = (Contractor && Contractor.id) || currentCustomer.id;
        }

        if (this.orderData.shippingContact === undefined) {
            this.orderData.shippingContact = await this.getDefaultShippingContact();
        }

        if (this.orderData.invoiceContact === undefined) {
            this.orderData.invoiceContact = await this.getDefaultInvoiceContact();
        }

        if (this.orderData.invoiceType === undefined) {
            this.orderData.invoiceType = await this.getDefaultInvoiceType();
        }

        if (this.orderData.invoiceInfo === undefined) {
            this.orderData.invoiceInfo = await this.getDefaultInvoiceInfo();
        }

        if (cartItems !== undefined && cartItems.length > 0) {
            this.orderData.currency = cartItems[0].packs[0].currency;
            this.orderData.orderItems = cartItems.map((e: any) => {
                var item = new OrderItem();
                item.product = e.product;
                item.packs = e.packs.map((v: any) => { return { ...v } }).filter((v: any) => v.quantity > 0 && v.price);
                item.packs.forEach((pk) => {
                    pk.retail = pk.price;
                })
                return item;
            });

            // 运费和运费减免
            this.orderData.freightFee = FREIGHTFEEFIXED;
            if (this.orderData.productAmount > FREIGHTFEEREMITTEDSTARTPOINT)
                this.orderData.freightFeeRemitted = FREIGHTFEEFIXED * -1;
        }
        if (currentCouponCode) {
            let coupon = await this.cApp.cCoupon.getCouponValidationResult(currentCouponCode);
            if (coupon.result === 1)
                this.applyCoupon(coupon);
            else
                this.cApp.currentCouponCode = undefined;
        }
    }

    private defaultSetting: any;
    private async getDefaultSetting() {
        if (this.defaultSetting) return this.defaultSetting;
        let { currentUser } = this.cApp;
        return this.defaultSetting = await currentUser.getSetting() || {};
    }

    private contact0: BoxId;
    private async getContact(): Promise<BoxId> {
        if (this.contact0 === null) return;
        if (this.contact0 !== undefined) return this.contact0;
        let { currentUser } = this.cApp;
        let contactArr = await currentUser.getContacts();
        if (contactArr === undefined || contactArr.length === 0) {
            this.contact0 = null;
            return;
        }
        return this.contact0 = contactArr[0].contact;
    }

    private async getDefaultShippingContact() {
        let defaultSetting = await this.getDefaultSetting();
        return defaultSetting.shippingContact || await this.getContact();
    }

    private async getDefaultInvoiceContact() {
        let defaultSetting = await this.getDefaultSetting();
        return defaultSetting.invoiceContact || await this.getContact();
    }

    private async getDefaultInvoiceType() {
        let defaultSetting = await this.getDefaultSetting();
        return defaultSetting.invoiceType;
    }

    private async getDefaultInvoiceInfo() {
        let defaultSetting = await this.getDefaultSetting();
        return defaultSetting.invoiceInfo;
    }

    submitOrder = async () => {
        let { orderItems } = this.orderData;

        let result: any = await this.uqs.order.Order.save("order", this.orderData.getDataForSave());
        await this.uqs.order.Order.action(result.id, result.flow, result.state, "submit");

        let param: [{ productId: number, packId: number }] = [] as any;
        orderItems.forEach(e => {
            e.packs.forEach(v => {
                param.push({ productId: e.product.id, packId: v.pack.id })
            })
        });
        let { cart } = this.cApp;
        cart.removeFromCart(param);

        // 打开下单成功显示界面
        nav.popTo(this.cApp.topKey);
        this.openVPage(OrderSuccess, result);
    }

    onSelectShippingContact = async () => {
        let cSelect = this.newC(CSelectShippingContact);
        let contactBox = await cSelect.call<BoxId>(true);
        this.orderData.shippingContact = contactBox;
    }

    onSelectInvoiceContact = async () => {
        let cSelect = this.newC(CSelectInvoiceContact);
        let contactBox = await cSelect.call<BoxId>(true);
        this.orderData.invoiceContact = contactBox;
    }

    onCouponEdit = async () => {
        let { cCoupon } = this.cApp;
        let coupon = await cCoupon.call<any>(this.orderData.coupon);
        if (coupon) {
            await this.applyCoupon(coupon);
        }
    }

    /**
     * 使用优惠券后计算折扣金额和抵扣额
     */
    applyCoupon = async (coupon: any) => {

        let { result: validationResult, id, code, discount, preferential, validitydate, isValid } = coupon;
        if (validationResult === 1 && code !== undefined && isValid === 1 && new Date(validitydate).getTime() > Date.now()) {
            this.orderData.coupon = id;
            this.couponData = coupon;
            if (discount) {
                // this.orderData.couponOffsetAmount = Math.round(this.orderData.productAmount * discount) * -1;
                let { orderItems } = this.orderData;
                if (orderItems !== undefined && orderItems.length > 0) {
                    let promises: PromiseLike<any>[] = [];
                    orderItems.forEach(e => {
                        promises.push(this.uqs.product.AgentPrice.table({ product: e.product.id, salesRegion: this.cApp.currentSalesRegion.id }));
                    });
                    let agentPrices = await Promise.all(promises);
                    if (agentPrices && agentPrices.length > 0) {
                        let couponOffsetAmount = 0;
                        for (let i = 0; i < orderItems.length; i++) {
                            let oi = orderItems[i];
                            let { product, packs } = oi;
                            let eachProductAgentPrice = agentPrices[i];
                            for (let j = 0; j < packs.length; j++) {
                                let pk = packs[j];
                                let agentPrice: any = eachProductAgentPrice.find(
                                    (p: any) => p.product.id === product.id &&
                                        p.pack.id === pk.pack.id &&
                                        p.discountinued === 0 &&
                                        p.expireDate > Date.now());
                                if (!agentPrice) break;
                                pk.price = Math.round(Math.max(agentPrice.agentPrice, pk.retail * (1 - discount)));
                                couponOffsetAmount += Math.round(pk.quantity * (pk.retail - pk.price) * -1);
                                /*
                                if (agentPrice) {
                                    pk.price = Math.round(agentPrice.retail * (1 - discount));
                                }
                                */
                            };
                        };
                        this.orderData.couponOffsetAmount = Math.round(couponOffsetAmount);
                    };
                }
            }
            if (preferential) {
                this.orderData.couponRemitted = preferential * -1;
            }
            // 运费和运费减免
            this.orderData.freightFee = FREIGHTFEEFIXED;
            if (this.orderData.productAmount > FREIGHTFEEREMITTEDSTARTPOINT)
                this.orderData.freightFeeRemitted = FREIGHTFEEFIXED * -1;
        }
    }

    /**
     * 删除优惠券
     */
    removeCoupon = () => {
        this.orderData.coupon = undefined;
        this.couponData = {};
        this.orderData.couponOffsetAmount = 0;
        this.orderData.couponRemitted = 0;
    }


    /*
    * 打开我的订单列表（在“我的”界面使用）
    */
    openMyOrders = async (state: string) => {

        this.openVPage(VMyOrders, state);
    }

    /**
     * 根据状态读取我的订单
     */
    getMyOrders = async (state: string) => {

        switch (state) {
            case 'pendingpayment':
                return await this.uqs.order.GetPendingPayment.table(undefined);
            case 'processing':
                return await this.uqs.order.Order.mySheets(undefined, 1, -20);
            case 'completed':
                return await this.uqs.order.Order.mySheets("#", 1, -20)
            case 'all':
                let promises: PromiseLike<any>[] = [];
                promises.push(this.uqs.order.Order.mySheets(undefined, 1, -20));
                promises.push(this.uqs.order.Order.mySheets("#", 1, -20));
                let presult = await Promise.all(promises);
                return presult[0].concat(presult[1]);
            default:
                break;
        }
    }

    /**
     * 打开发票信息编辑界面
     */
    onInvoiceInfoEdit = async () => {
        let cInvoiceInfo = this.newC(CInvoiceInfo); // new CInvoiceInfo(this.cApp, undefined, true);
        let { invoiceType, invoiceInfo } = this.orderData;
        let origInvoice = {
            invoiceType: invoiceType,
            invoiceInfo: invoiceInfo,
        }
        let newInvoice = await cInvoiceInfo.call<any>(origInvoice, true);
        this.orderData.invoiceType = newInvoice.invoiceType;
        this.orderData.invoiceInfo = newInvoice.invoiceInfo;
    }

    openOrderDetail = async (orderId: number) => {

        let order = await this.uqs.order.Order.getSheet(orderId);
        let { data } = order;
        let { orderitems } = data;
        let orderItemsGrouped = groupByProduct(orderitems);
        data.orderItems = orderItemsGrouped;
        this.openVPage(VOrderDetail, order);
    }

    openMeInfo = async () => {
        let { cMe } = this.cApp;
        await cMe.openMeInfoFirstOrder();
    }

    renderDeliveryTime = (pack: BoxId) => {
        let { cProduct } = this.cApp;
        return cProduct.renderDeliveryTime(pack);
    }

    renderOrderItemProduct = (product: BoxId) => {
        let { cProduct } = this.cApp;
        return cProduct.renderCartProduct(product);
    }
}
