import * as React from 'react';
import { Page } from 'tonva';
import marked from 'marked';
import logo from '../images/logo.png';

const content = `<p>　　百灵威科技有限公司是一家致力于研发和生产化学及相关产品，集敏捷制造、全球营销和现代物流为一体的高科技企业。
百灵威在中国内地、香港，欧洲及北美等多个国家和地区设有物流中心，实行专业化、个性化的一站式服务，
为全球超过200,000 名科技和工业领域的客户提供产品资源及配套技术服务。</p>
<p>　　百灵威现代化的研发制造基地拥有一支富有创造天赋的专业团队，新技术、新产品层出不穷，J&K®、Amethyst®、J&K Scientific® 产品
已多达30,000 种以上，并呈几何级数增长。作为国际化的资源平台公司，百灵威致力于促进全球产业链的合作，不断推进集约式发展，
集成资源600,000 余种，包括高纯有机试剂、无机试剂、生化试剂、分析试剂、标准品、金属有机催化剂、医药中间体、超精细材料、
以及实验室仪器、耗材等众多产品。百灵威的柔性生产线能够快速提供小批量、多品种的原料，满足实验、中试以至规模化生产的需要。
</p>
<p>　　百灵威秉承“诚实守信、开拓创新、合作共赢、实现卓越”的价值观，致力于与化学、生物医药、精细化工、食品工业、现代农业、电子、日化、
石化、纺织、生命科学、环境保护、疾病控制、新能源、新材料、航空航天等领域的客户建立互信、长久的合作关系，
为实现“促进科技与工业发展，造福人类”的使命而不懈努力！
</p>
`

export class About extends React.Component {
    render() {
        let right = null;
        return <Page header="关于百灵威" right={right}>
            <div className='bg-white p-3'>
                <img className="h-3c position-absolute" src={logo} alt="百灵威" />
                <div className="h3 flex-fill text-center">
                    <span className="text-primary mr-3">百灵威集团</span>
                </div>
                <div className="mt-5" dangerouslySetInnerHTML={{ __html: marked(content) }} />
            </div>
        </Page>;
    }
}