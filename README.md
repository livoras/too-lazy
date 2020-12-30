# too-lazy.js

## 背景和设计 
现在所有的前端框架、视图库，不管是 Vue、React、Angular 还是微信小程序。都是在模板、HTML 里面进行数据绑定、函数绑定，每次都要在 HTML 里面写这些内容是非常繁琐的。而且 HTML 语法啰嗦，并不能说得上好维护。

能否反过来思考，从数据、事件处理函数出发，以它们为核心自动生成对应的 HTML 文件核心结构。并且可以基于这种结构再做维护，让 HTML 回归结构和样式的本源。

核心思想：**数据（data）和操作数据的方法（method）才是程序设计的核心，HTML 结构不是。**

HTML 和数据之间的桥接关系可以细分一下：

1. 文本插入: `<span>{{title}}</span>`
2. 属性插入: `<div class="{{colorTheme}}">`
3. 事件处理：`<button onClick="{{handleSubmitForm}}">`
4. 循环模板：`<div forEach="{{users}}" />`
5. 条件渲染：`<h1 if="{{isShowTitle}}" />`

我们可以在逻辑层面就通过特定的方式简单地声明这几种关系：

```typescript
class Page {
  /** 文本插入 */
  @h1('title').text()
  public tittle: string

  /** 属性插入 */
  @div('container').attr('class') // or @div('container').class()
  public colorTheme: string

  /** 事件处理 */
  @button('submit-button').click()
  public handleSubmitForm() {}

  /** 循环模板 */
  @div('users').forEach()
  public users: Users[]

  /** 条件渲染 */
  @h1('head').ifShow()
  public isShowTitle: boolean
}
```

当然可以拓展更多的方便的桥接工具方法，例如数据双向绑定：

```typescript
class Page {
  @h1('title').text()
  public title: string = ''

  @button('clear').text()
  public buttonText: string = '清除'

  @input('title-input').change()
  @databind('title')
  public handleTitleChange() {}

  @button('clear').click()
  public handleClearTitle() {}
}
```

这样会生成对应的 HTML 结构：

```html
<h1 title>{{title}}</h1>
<input title-input onChange="handleTitleChange" />
<button clear>{{buttonText}}</button>
```

用这样的方式可以写一个 TodoApp：

```typescript

@autoMarkup()
class Home {
  public onLoad(): void {
  }
  ///////////////// 中间程序会根据以下的配置生成 wxml 并且绑定事件 ///////////////////////////
  /**
   * 自动生成 <view wx:for="{{todoList}}" />
   */
  @view('todo-list').forEach()
  public todoList!: User[]

  /** 自动生成 <input bind:change="handleInputToDoTitle">，并且自动修改 data.title */
  @input('todo-input').change()
  @databind('title')
  public handleInputToDoTitle() {}

  /** 自动生成 <button bind:tap="handleTapAddTodo"> */
  @button('add-todo').tap()
  public handleTapAddTodo() {
    this.setData({ todoList: [...todoList, { title: this.data.title } ], title: '' })
  }

  /** 自动生成 wx:for 的 view 里面的 checkbox，并且自动修改元素的 done: true/false */
  @checkbox('todo-list > check-todo').change()
  @toggle('todoList[index].done')
  public handleToggleTodo() {}

  /** 自动生成 wx:for 的 view 里面的 <button>，并且删除点击的时候删除 todoList[index] */
  @button('todo-list > delete-todo').tap()
  @remove('todoList[index]')
  public handleDeleteTodo() { }
}
```

## 样式和结构问题

这时候会产生另外一个问题，因为 HTML 是通过代码生成的，如何给它加上样式？如果强行改这个文件，例如给 `<h1 title>` 里面加入了一个 `<div>`：

```html
<h1 title><div class="red">{{title}}</div></h1>
```

那么就和代码里面写的 `@h1('title').text()` 产生了不一致的结果，这时候生成程序应该怎么处理这种情况？如果再次生成一次 `{{title}}`：

```html
<h1 title>{{title}}<div class="red">{{title}}</div></h1>
```

这样明显有病。

如何在 **可以在生成的代码中添加结构和样式的同时，又要保证生成的元素和代码中配置的一致性** 是个大问题。

如果可以随意修改生成的核心 HTML 代码，会导致一致性问题。设想可以加入修改限制：

### 限制 1：生成的元素必须存在，不能删除
你可以随意调整生成的 HTML 元素的位置，但是不能删除它。

### 限制 2：如果配置定义了层次结构，必须保持嵌套关系的不变

例如，文本属性插入必须在原来的父节点内、循环模板内部元素结构和父元素保持层级关系（嵌套深度的可以变化，嵌套关系不能发生改变）。举个例子：

```typescript
class Page {
  @h1('head').text()
  public title: string

  @div('user').forEach()
  public users: User[]

  @button('user > remove-user').click()
  public handleClickRemoveUser(): void {}
}
```

会生成 HTML 结构：

```html
<h1 head>{{head.text(title)}}</h1>
<div user forEach="users">
  <button remove-user onClick="handleClickRemoveUser"></button>
</div>
```

生成的核心元素的抽象嵌套结构是：

```html
  * head -> head.text
  * user -> remove-user
```

这时候这么去改 HTML 结构是合法的：

```html
<div user forEach="users">
  <div>
    <span>{{user.name}}</span>
    <button remove-user onClick="handleClickRemoveUser"></button>
  </div>
</div>
<h1 head>
  <div class="red"> {{head.text(title)}} </div>
</h1>
```

因为它们的嵌套结构没有发生改变：`head.text` 还在 `head` 里面，`remove-user` 还在 `user` 里面。

```html
  * user -> remove-user
  * head -> head.text
```

但是如果这么去改：

```html
<div user forEach="users">
</div>
<button remove-user onClick="handleClickRemoveUser"></button>
```

是不合法的，因为这样的嵌套结构就变成了：

```html
  * user
  * remove-user
```

有两个问题：

1. 把 head 元素删除了，违反了原则 1
2. 原来 remove-user 是在 user 下面的，现在被搞出来了，嵌套关系发生了改变。违反了原则 2

这时候应该报错，因为已经产生了和原有代码配置中的抽象嵌套结构不一致的情况。

保持两个原则：

1. 生成的元素必须存在，不能删除
2. 如果配置定义了层次结构，必须保持嵌套关系的不变

的条件下，HTML 可以随意修改调整结构和样式，并且又可以保持和代码配置的一致性。
