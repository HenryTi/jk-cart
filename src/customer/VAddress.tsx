import * as React from 'react';
import { VPage, Page, BoxId } from 'tonva';
import { tv } from 'tonva';
import { List, FA } from 'tonva';
import { CAddress } from './CAddress';
import { GLOABLE } from 'configuration';

export class VAddress extends VPage<CAddress> {
    private provinceId: number;
    private cityId: number;
    private countyId: number;
    private backLevel = 0;

    async open(param: any) {
        let provinces = await this.controller.getCountryProvince(GLOABLE.CHINA);
        this.openPage(this.page, { provinces: provinces });
    }

    private page = (param: any) => {
        this.backLevel++;
        return <Page header="选择所在省市">
            <div className="row no-gutters">
                {param.provinces.map((v: any) => this.renderPCC(v.province, this.onProvinceClick))}
            </div>
        </Page>
    }

    private renderPCC = (pcc: BoxId, onClick: any) => {
        return <div key={pcc.id} className="col-6 col-md-4 col-lg-3 cursor-pointer">
            {tv(pcc, (value) => {
                let { id, chineseName } = value;
                return <>
                    <div className="pt-1 pb-1 px-2" onClick={() => onClick(id)}
                        style={{ border: '1px solid #eeeeee', marginRight: '-1px', marginBottom: '-1px' }}
                    >
                        <span className="ml-1 align-middle">
                            <FA name="chevron-right" className="text-info small" />
                            &nbsp; {chineseName}
                        </span>
                    </div>
                </>;
            })}
        </div>
    }

    private onProvinceClick = async (provinceId: any) => {
        this.provinceId = provinceId;
        let cities = await this.controller.getProvinceCities(provinceId);
        if (cities) {
            let len = cities.length;
            if (len === 1) {
                await this.onCityClick(cities[0].city.id);
                return;
            }
            if (len > 1) {
                this.backLevel++;
                this.openPageElement(<Page header="选择所在城市">
                    <div className="row no-gutters">
                        {cities.map(v => this.renderPCC(v.city, this.onCityClick))}
                    </div>
                </Page>);
                return;
            }
        } else {
            this.closePage(this.backLevel);
            this.saveAddress();
        }
    }

    private onCityClick = async (cityId: any) => {
        this.cityId = cityId;
        let counties = await this.controller.getCityCounties(cityId);
        if (counties && counties.length > 0) {
            this.backLevel++;
            this.openPageElement(<Page header="选择所在区县">
                <div className="row no-gutters">
                    {counties.map(v => this.renderPCC(v.county, this.onCountyClick))}
                </div>
            </Page>);
        } else {
            this.closePage(this.backLevel);
            this.saveAddress();
        }
    }

    private onCountyClick = async (countyId: any) => {
        this.countyId = countyId;
        this.closePage(this.backLevel);
        this.saveAddress();
    }

    private saveAddress = async () => {
        await this.controller.saveAddress(GLOABLE.CHINA, this.provinceId, this.cityId, this.countyId);
    }
}
