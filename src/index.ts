
/**
 * 背景：
 * 

 */
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
