import * as React from 'react';
import { CCoupon } from './CCoupon';
import { VPage, Page, BoxId, List, tv, FA, EasyDate, LMR } from 'tonva';
import { renderProduct } from 'product';

export class VSharedCoupon extends VPage<CCoupon> {

    private couponValidationResult: any;
    private products: any[] = [];
    async open(param: any) {
        this.couponValidationResult = param.couponValidationResult;
        this.products = param.products || [];
        this.openPage(this.page);
    }

    private renderProduct = (product: any) => {
        // return <div>{tv(product, (v) => v.description)}</div>
        // return <div>{product.description}</div>;
    }

    private showProductDetail = async (product: any) => {
        await this.controller.showProductDetail(product);
    }

    private page = () => {
        let { result, id, code, discount, preferential, validitydate, isValid } = this.couponValidationResult;

        let couponUi;
        if (result !== 1 || !isValid) {
            couponUi = <div className="alert alert-primary my-1" role="alert">
                <FA name="exclamation-circle" className="text-warning float-left mr-3" size="2x"></FA>
                优惠券【{code}】无效，请与您的专属销售人员联系。
            </div>
        } else {
            this.controller.cApp.currentCouponCode = code;
            let codeShow = String(code + 100000000);
            let p1 = codeShow.substr(1, 4);
            let p2 = codeShow.substr(5, 4);
            codeShow = p1 + ' ' + p2;

            let aleft = <div><FA name='th-large' className='my-2 mr-3 text-warning' />{codeShow}</div>;
            let aright = <div className="text-muted"><small>有效期：<EasyDate date={validitydate} /></small></div>;
            let bcenter: any, bleft: any;
            if (typeof discount === 'number') {
                let discountShow: any;
                discountShow = (1 - discount) * 10;
                bleft = <div><small><span className=" mx-3 ">{discountShow === 10 ? '无折扣' : <>{discountShow.toFixed(1)} 折</>}</span></small></div>;
            }
            if (preferential)
                bcenter = <div className="text-muted"><small>优惠：<span className="mx-3">￥{preferential}</span></small></div>;

            couponUi = <div className="bg-white p-3 mb-1">
                <LMR left={aleft} right={aright} />
                <LMR left={bleft} right={<small className="text-success">此优惠券也可用于订购其他产品</small>}>
                    {bcenter}
                </LMR>
            </div>
        }
        return <Page header="分享">
            {couponUi}
            <List items={this.products} item={{ render: renderProduct, onClick: this.showProductDetail }} none={null} />
        </Page>
    }
}