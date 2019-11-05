import * as React from 'react';
import { observable } from 'mobx';
import { observer } from 'mobx-react';
import { VPage, Page, tv, List, LMR, FA } from 'tonva';
import { COrder } from './COrder';
import { OrderItem } from './Order';
import { CartPackRow } from '../cart/Cart';
import classNames from 'classnames';
import { GLOABLE } from 'configuration';

export class VCreateOrder extends VPage<COrder> {
    @observable private useShippingAddress: boolean = true;
    @observable private shippingAddressIsBlank: boolean = false;
    @observable private invoiceAddressIsBlank: boolean = false;
    @observable private invoiceIsBlank: boolean = false;

    async open(param: any) {
        this.openPage(this.page);
    }

    private nullContact = () => {
        return <span className="text-primary">选择收货地址</span>;
    }

    private packsRow = (item: CartPackRow, index: number) => {
        let { pack, quantity, price, retail, currency } = item;

        return <div key={index} className="px-2 py-2 border-top">
            <div className="d-flex align-items-center">
                <div className="flex-grow-1"><b>{tv(pack)}</b></div>
                <div className="w-12c mr-4 text-right">
                    <span className="text-danger h5"><small>¥</small>{parseFloat((retail * quantity).toFixed(2))}</span>
                    <small className="text-muted">(¥{parseFloat(retail.toFixed(2))} × {quantity})</small>
                </div>
            </div>
            <div>{this.controller.renderDeliveryTime(pack)}</div>
        </div>;
    }

    private renderOrderItem = (orderItem: OrderItem) => {
        let { product, packs } = orderItem;
        let { controller, packsRow } = this;
        return <div>
            <div className="row">
                <div className="col-lg-6 pb-3">{controller.renderOrderItemProduct(product)}</div>
                <div className="col-lg-6">{
                    packs.map((p, index) => {
                        return packsRow(p, index);
                    })
                }</div>
            </div>
        </div>;
    }

    private orderItemKey = (orderItem: OrderItem) => {
        return orderItem.product.id;
    }

    private renderCoupon = observer((param: any) => {
        let { couponData } = this.controller;
        if (couponData['id'] === undefined) {
            return <span className="text-primary">使用优惠券</span>;
        } else {
            let { id, code, discount, preferential, validitydate, isValid } = couponData;
            let { couponOffsetAmount, couponRemitted } = param;
            let offsetUI, remittedUI, noOffsetUI;
            if (couponOffsetAmount || couponRemitted) {
                if (couponOffsetAmount) {
                    offsetUI = <div className="d-flex flex-row justify-content-between">
                        <div className="text-muted">折扣:</div>
                        <div className="text-right text-danger"><small>¥</small>{couponOffsetAmount.toFixed(2)}</div>
                    </div>
                }
                if (couponRemitted) {
                    remittedUI = <div className="d-flex flex-row justify-content-between">
                        <div className="text-muted">抵扣:</div>
                        <div className="text-right text-danger"><small>¥</small>{couponRemitted.toFixed(2)}</div>
                    </div>
                }
            } else {
                noOffsetUI = <div>谢谢惠顾</div>;
            }
            return <div className="mr-2">
                <div className="text-success">{code.substr(0, 4)} {code.substr(4)}</div>
                {offsetUI}
                {remittedUI}
                {noOffsetUI}
            </div>
        }
    });

    private onSubmit = async () => {
        let { orderData } = this.controller;
        // 必填项验证
        let { shippingContact, invoiceContact, invoiceType, invoiceInfo } = orderData;
        if (!shippingContact) {
            this.shippingAddressIsBlank = true;
            setTimeout(() => this.shippingAddressIsBlank = false, GLOABLE.TIPDISPLAYTIME);
            return;
        }
        if (!invoiceContact) {
            if (this.useShippingAddress) {
                orderData.invoiceContact = shippingContact; //contactBox;
                this.invoiceAddressIsBlank = false;
            } else {
                this.invoiceAddressIsBlank = true;
                setTimeout(() => this.invoiceAddressIsBlank = false, GLOABLE.TIPDISPLAYTIME);
                return;
            }
        }
        if (!invoiceType || !invoiceInfo) {
            this.invoiceIsBlank = true;
            setTimeout(() => this.invoiceIsBlank = false, GLOABLE.TIPDISPLAYTIME);
            return;
        }

        this.controller.submitOrder();
    }

    private page = observer(() => {

        let { cApp, orderData, onSelectShippingContact, onSelectInvoiceContact, openMeInfo, onInvoiceInfoEdit, onCouponEdit } = this.controller;
        let { currentUser } = cApp;
        let fillMeInfo = <div onClick={openMeInfo} className="alert alert-warning text-primary py-1" role="alert">
            首次下单请点击完善您的个人信息
        </div>
        if (currentUser.allowOrdering) {
            fillMeInfo = null;
        }
        let footer = <div className="d-block">
            {fillMeInfo}
            <div className="w-100 px-3">
                <div className="d-flex justify-content-left flex-grow-1">
                    <span className="text-danger" style={{ fontSize: '1.8rem' }}><small>¥</small>{orderData.amount}</span>
                </div>
                <button type="button"
                    className={classNames('btn', 'w-30', { 'btn-danger': currentUser.allowOrdering, 'btn-secondary': !currentUser.allowOrdering })}
                    onClick={this.onSubmit} disabled={!currentUser.allowOrdering}>提交订单
                </button>
            </div>
        </div >;

        let chevronRight = <FA name="chevron-right" className="cursor-pointer" />
        let shippingAddressBlankTip = this.shippingAddressIsBlank ?
            <div className="text-danger small my-2"><FA name="exclamation-circle" /> 必须填写收货地址</div>
            : null;
        let invoiceAddressBlankTip = this.invoiceAddressIsBlank ? <div className="text-danger small my-2"><FA name="exclamation-circle" /> 必须填写发票地址</div> : null;
        let divInvoiceContact: any = null;
        if (this.useShippingAddress === false) {
            if (orderData.invoiceContact !== undefined) {
                divInvoiceContact = <div className="col-8 col-sm-10 offset-4 offset-sm-2 d-flex">
                    {tv(orderData.invoiceContact, undefined, undefined, this.nullContact)}
                    <div>{chevronRight}</div>
                </div>
            } else {
                divInvoiceContact = <div className="col-8 offset-4 offset-sm-2">
                    <button className="btn btn-outline-primary"
                        onClick={onSelectInvoiceContact}>选择发票地址</button>
                    {invoiceAddressBlankTip}
                </div>
            }
        }

        let invoiceContactUI = <div className="row py-3 bg-white mb-1">
            <div className="col-4 col-sm-2 pb-2 text-muted">发票地址:</div>
            <div className="col-8 col-sm-10">
                <div>
                    <label className="cursor-pointer">
                        <input type="checkbox"
                            defaultChecked={this.useShippingAddress}
                            onChange={e => {
                                this.useShippingAddress = e.currentTarget.checked;
                                orderData.invoiceContact = undefined;
                                this.invoiceAddressIsBlank = false;
                            }} /> 同收货地址
                    </label>
                </div>
            </div>
            {divInvoiceContact}
        </div>

        let invoiceBlankTip = this.invoiceIsBlank ? <div className="text-danger small my-2"><FA name="exclamation-circle" /> 必须填写发票信息</div> : null;
        let invoiceInfoUI = <div className="row py-3 bg-white mb-1" onClick={onInvoiceInfoEdit}>
            <div className="col-4 col-sm-2 pb-2 text-muted">发票信息:</div>
            <div className="col-8 col-sm-10">
                <LMR className="w-100 align-items-center" right={chevronRight}>
                    {tv(orderData.invoiceType, (v) => <>{v.description}</>, undefined, () => <span className="text-primary">填写发票信息</span>)}
                    {tv(orderData.invoiceInfo, (v) => <> -- {v.title}</>, undefined, () => <></>)}
                    {invoiceBlankTip}
                </LMR>
            </div>
        </div>

        let freightFeeUI = <></>;
        let freightFeeRemittedUI = <></>;
        if (orderData.freightFee) {
            freightFeeUI = <>
                <div className="col-4 col-sm-2 pb-2 text-muted">运费:</div>
                <div className="col-8 col-sm-10 text-right text-danger"><small>¥</small>{orderData.freightFee}</div>
            </>
            if (orderData.freightFeeRemitted) {
                freightFeeRemittedUI = <>
                    <div className="col-4 col-sm-2 pb-2 text-muted">运费减免:</div>
                    <div className="col-8 col-sm-10 text-right text-danger"><small>¥</small>{orderData.freightFeeRemitted}</div>
                </>
            }
        }

        let couponUI = <></>;
        if (1 === 1) {
            couponUI = <div className="row py-3 bg-white mb-1" onClick={onCouponEdit}>
                <div className="col-4 col-sm-2 pb-2 text-muted">优惠券:</div>
                <div className="col-8 col-sm-10">
                    <LMR className="w-100 align-items-center" right={chevronRight}>
                        <this.renderCoupon couponOffsetAmount={orderData.couponOffsetAmount} couponRemitted={orderData.couponRemitted} />
                    </LMR>
                </div>
            </div>
        }

        return <Page header="订单预览" footer={footer}>
            <div className="px-2">
                <div className="row py-3 bg-white mb-1" onClick={onSelectShippingContact}>
                    <div className="col-4 col-sm-2 pb-2 text-muted">收货地址:</div>
                    <div className="col-8 col-sm-10">
                        <LMR className="w-100 align-items-center" right={chevronRight}>{tv(orderData.shippingContact, undefined, undefined, this.nullContact)}</LMR>
                        {shippingAddressBlankTip}
                    </div>
                </div>
                {invoiceContactUI}
                {invoiceInfoUI}
            </div>
            <List items={orderData.orderItems} item={{ render: this.renderOrderItem, key: this.orderItemKey as any }} />
            <div className="px-2">
                <div className="row py-3 pr-3 bg-white my-1">
                    <div className="col-4 col-sm-2 pb-2 text-muted">商品总额:</div>
                    <div className="col-8 col-sm-10 text-right"><small>¥</small>{orderData.productAmount}</div>
                    {freightFeeUI}
                    {freightFeeRemittedUI}
                </div >
                {couponUI}
            </div>
        </Page >
    })
}