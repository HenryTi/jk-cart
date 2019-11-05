import * as React from 'react';
import { VPage, FA, Page } from 'tonva';
import { CCoupon } from './CCoupon';
import { observer } from 'mobx-react';
import { observable } from 'mobx';
import { GLOABLE } from 'configuration';

export class VCouponEdit extends VPage<CCoupon> {

    private couponInput: HTMLInputElement;
    @observable tips: string;
    async open(param: any) {
        if (param !== undefined) {

        }
        this.openPage(this.page);
    }

    private applyCoupon = async () => {
        let coupon = this.couponInput.value;
        if (!coupon)
            return;
        let ret = await this.controller.applyCoupon(coupon);
        switch (ret) {
            case -1:
                this.tips = '对不起，当前服务器繁忙，请稍后再试。';
                break;
            case 1:
                this.tips = '有效';
                break;
            case 0:
            case 2:
            case 3:
            case 5:
                this.tips = '优惠券无效，请重新输入或与您的专属销售人员联系。';
                break;
            case 6:
                this.tips = '不允许使用本人优惠券！';
                break;
            case 4:
                this.tips = '该优惠券已经被使用过了，不允许重复使用。';
                break;
            default:
                break;
        }
        if (this.tips)
            setTimeout(() => this.tips = undefined, GLOABLE.TIPDISPLAYTIME);
    }

    private page = observer(() => {
        let tipsUI = <></>;
        if (this.tips) {
            tipsUI = <div className="alert alert-primary" role="alert">
                <FA name="exclamation-circle" className="text-warning float-left mr-3" size="2x"></FA>
                {this.tips}
            </div>
        }
        return <Page header="填写优惠券">
            <div className="px-2 bg-white">
                <div className="row py-3 pr-3 my-1">
                    <div className="col-4 col-sm-2 pb-2 text-muted">优惠券:</div>
                    <div className="col-8 col-sm-10 d-flex">
                        <input ref={v => this.couponInput = v} type="number" className="form-control"></input>
                    </div>
                </div>
                <div className="row my-1">
                    <div className="col-12">
                        <button className="btn btn-primary w-100" onClick={this.applyCoupon}>使用</button>
                    </div>
                </div>
                {tipsUI}
            </div>
        </Page>
    })
}