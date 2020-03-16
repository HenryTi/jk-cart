import * as React from 'react';
import { View, nav, LMR, Image, FA } from 'tonva';
import { EditMeInfo } from './EditMeInfo';
import { CMe } from './CMe';

export class VLoginState extends View<CMe> {

    render() {
        let { user } = nav;
        if (user === undefined) {
            return <div className="w-100">
                <a href="/shop?type=login">登录</a>
            </div>
        }
        let { id, name, nick, icon } = user;
        return <div>
            <LMR className="py-2 cursor-pointer w-100"
                left={<Image className="w-3c h-3c mr-3" src={icon} />}
                right="退出"
                onClick={() => {
                    this.openVPage(EditMeInfo);
                }}>
                <div>
                    <div>{userSpan(name, nick)}</div>
                    <div className="small"><span className="text-muted">ID:</span> {id > 10000 ? id : String(id + 10000).substr(1)}</div>
                </div>
            </LMR>
        </div>;
    }
}

export function userSpan(name: string, nick: string): JSX.Element {
    return nick ?
        <><b>{nick} &nbsp; <small className="muted">{name}</small></b></>
        : <b>{name}</b>
}
