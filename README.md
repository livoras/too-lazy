# too-lazy
HTML 里面有很多数据绑定、函数绑定，每次都要在 HTML 里面写是非常繁琐的。 而且 HTML 语法啰嗦，并不能说得上好维护。

能否反过来思考，从数据、事件处理函数出发，以它们为核心自动生成对应的 HTML 文件核心结构。并且可以基于这种结构再做维护，让 HTML 回归结构和样式的本源。

核心思想：数据（data）和操作数据的方法（method）才是程序设计的核心，HTML 结构不是。

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

当然可以拓展更多的方便的桥接工具方案，例如数据双向绑定：

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

这时候会产生另外一个问题，因为 HTML 是通过代码生成的，如何给它加上样式？如果强行改这个文件，例如给 `<h1 title>` 里面加入了一个 `<div>`：

```html
<h1 title><div class="red">{{title}}</div></h1>
```

那么就和代码里面写的 `@h1('title').text()` 产生了不一致的结果，这时候生成程序应该怎么处理这种情况？如果再次生成一次 `{{title}}`：

```html
<h1 title>{{title}}<div class="red">{{title}}</div></h1>
```

这样明显有病。

如何在 **生成的代码中添加结构和样式，但又要保证生成的元素和代码中配置的一致性** 是个大问题。

我们定义生成元素的一致性：

```typescript

@autoMarkup()
class Home {
  public onLoad(): void {
  }
  ///////////////// 中间程序会根据以下的配置生成 wxml 并且绑定事件 ///////////////////////////
  /**
   * 自动生成 <view wx:for="{{todoList}}" />
   */
  @list.view('todo-list')
  public todoList!: User[]

  /** 自动生成 <input bind:change="handleInputToDoTitle">，并且自动修改 data.title */
  @databind('title')
  @input.change('todo-input')
  public handleInputToDoTitle() {}

  /** 自动生成 <button bind:tap="handleTapAddTodo"> */
  @button.tap('add-todo')
  public handleTapAddTodo() {
    this.setData({ todoList: [...todoList, { title: this.data.title } ], title: '' })
  }

  /** 自动生成 wx:for 的 view 里面的 checkbox，并且自动修改元素的 done: true/false */
  @checkbox.change('todo-list > check-todo')
  @toggle('todoList[index].done')
  public handleToggleTodo() {}

  /** 自动生成 wx:for 的 view 里面的 <button>，并且删除点击的时候删除 todoList[index] */
  @button.tap('todo-list > delete-todo')
  @remove('todoList[index]')
  public handleDeleteTodo() {
  }
}
```
