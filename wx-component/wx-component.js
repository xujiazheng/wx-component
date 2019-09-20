/**
 * 组件增强：
 * Component({
 *    name: 'vo', // 增强组件名
 *    // 组件动态数据，自动绑定到page data中。
 *    // 使用场景： 组件在页面中需要wx:if切换视图，会触发重复的挂载，因此组件数据不可保留，
 *    // 使用$$data可以做到缓存数据，再次挂载组件，数据还原上次内容
 *    $$data: {},
 *    // 向页面抛出方法，在页面可以调用此方法来通知组件做一些事情。调用如：（this.$vo.xx)
 *    $parentMethods: {},
 * })
 */

const getCurPage = () => {
    let pages = getCurrentPages();
    let curPage = pages[pages.length - 1];
    return curPage;
};

/**
 * 给组件所在页面绑定需同步更新的data，当组件data更新，自动同步到当前页面的data
 * @param {Object} target 组件实例
 * @param {Object} data 组件缓存data对象
 */
const bindDataForPage = (target, $$data) => {
    const id = target._id;
    let data = Object.assign({}, $$data);
    delete data._id;

    const _setData = target.setData.bind(target);
    const $curPage = target.$parent;
    const _pageSetData = $curPage.setData.bind($curPage);
    const cacheData = $curPage.data[id];
    /**
     * 如果组件挂载页面后，当前页面有组件缓存数据，则将这份数据set到组件的data
     * 如果没有混存数据，则组件第一此挂载到此页面，分别给组件和页面set初始data
     */

    if (cacheData) {
        _setData(cacheData);
    } else {
        _setData(data);
        _pageSetData({
            [id]: data,
        });
    }
    /**
     * 监听组件setData方法，如果触发了setData，将需要缓存的内容同步更新到页面
     */
    Object.defineProperty(target, 'setData', {
        value(options) {
            _setData(options);
            const _bindData = Object.keys(options).reduce((obj, key) => {
                if (data.hasOwnProperty(key)) {
                    obj[`${id}.${key}`] = options[key];
                }
                return obj;
            }, {});
            _pageSetData(_bindData);
        },
    });
};

/**
 * 组件暴露方法到页面实例上
 * @param {Object} target 组件实例
 * @param {Object} methods 挂载到页面的方法对象
 */
const bindMethodsToPage = (target, methods) => {
    const id = target._id;
    const curPage = target.$parent;
    curPage[id] = {};
    for (let key in methods) {
        curPage[id][key] = methods[key].bind(target);
    }
};

/**
 * 混入函数对象
 * 混入的函数接收原函数和原函数的参数，执行完需要执行的逻辑后接着执行原函数
 */
const minxs = {
    // attached时将事件处理对象绑定到组件实例上。
    attached(origin, wrapOpts) {
        this.$parent = getCurPage();
        this._id = `$${wrapOpts.name}`;
        if (wrapOpts.$$data) {
            bindDataForPage(this, wrapOpts.$$data);
        }
        if (wrapOpts.$parentMethods) {
            bindMethodsToPage(this, wrapOpts.$parentMethods);
        }

        origin && origin.call(this);
    },
};
// 初始化minxs
const initMinxs = (opts) => {
    for (let key in minxs) {
        let handle = opts[key];

        opts[key] = function (...args) {
            minxs[key].call(this, handle, ...args, opts);
        };
    }
};

// Base函数将传入的原始数据进行修改，返回新的对象
const Base = (opts) => {
    const newOpts = Object.assign({}, opts);
    initMinxs(newOpts);
    return newOpts;
};

module.exports = Base;
