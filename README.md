# wx-component

微信自定义组件封装工具，通过此工具，你可以做到：

1. 自定义组件中的data可以自动同步到所在页面中去
2. 自定义组件可以暴露方法给当前页面实例

## 为什么要这样做

在小程序组件开发中，遵守低耦合高内聚的原则，我希望我的组件拿来就用，而不是需要外界做很多事情。这样一来，我需要将所有的数据以及交互都内聚到组件内部，让组件内部去管理，但是遇到了几种情况：

### 数据在组件内部存储，一旦页面发生wx:if切换，数据将丢失

因为wx:if是dom的移除，每次切换视图都会重新渲染组件，而不是重新显示组件，因此组件内部data是无法保存的

```html
<!---->
<view wx:if="{{!showLogin}} class="container">主页内容展示</view>
<Login wx:else></Login>
```

#### 问题
当我们主页点击某按钮时，渲染Login组件，当Login组件点击取消，渲染主页，
那么当再次点击进入Login界面时，你会发现你输入的用户名等信息没有了，为什么？

#### 解答 
wx:if为dom的移除与添加，再次显示时，Login组件重新渲染，数据为组件初始状态，因此数据丢失。

#### 如何解决

当然，你可以说把用户名密码存储在Page里，通过传值的方式给Login组件，这样就可以保证了，看一下代码

```html
<!--如果userName和password保存在页面级-->
<Login name="{{userName}} password="{{password}}" bindinput="onInput"></Login>
```
```javascript
// Page.js
Page({
    data: {
        userName: '',
        password: '',
    },
    onInput(e) {
        const {key, value} = e.detail;
        this.setData({
            [key]: value,
        });
    }
})
```

问题来了，如果这样的话，我这个组件的意义在哪里，我写了一个Login组件，但是逻辑几乎都在Page层，而且还增加了一个事件中间层的成本。这样写其实就是写了一个Login的样式模板，我是不能接受的。至少，如果详情页也需要同样的功能，我需要复制同样的代码过去。

**使用wx-component**

```html
<!--不需要任何操作-->
<Login></Login>
```

```javascript
// component.js

import Base from './wx-component.js'; // 引入js文件

Component(Base({
    name: 'login',
    // 需要缓存的数据对象，这里缓存userName和password
    $$data: {
        userName: '',
        password: '',
    },
    // 其他不需要缓存的data
    data: {}
}))
```

使用wx-component只需要这样，就可以做到缓存组件数据

### 页面级控制组件内部行为

有，时候我们可能需要在小程序Page中主动去控制组件的一些非自发行为，比如重置、切换等。

```html
<!--重置表单-->
<Apply></Apply>
<button>重置表单</button>
```

#### 问题

当我按下button时，需要重置Apply组件内的信息，该怎么做？

#### 如何解决

同样，我们也可以将所有的状态都放在Page中，但是这样做带来的是组件功能无法内聚。

**使用wx-component**

```javascript
// component.js

import Base from './wx-component.js'; // 引入js文件

Component(Base({
    name: 'apply',
    // 暴露给page实例的方法
    $parentMethods: {
        reset() {
            this.setData({
                // 重置所有信息
            })
        }
    }
}))

```

```javascript
// page.js

Page({
    onReset() {
        // 页面中调用reset方法
        this.$apply.reset();
    }
})
```

使用wx-component后将变得很简单，并且组件的功能保留内聚的原则

