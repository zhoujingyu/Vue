Vue.mixin({
  beforeCreate() {
    console.log('mixin beforeCreate')
  },
  created() {
    console.log('mixin created')
  },
  beforeMount() {
    console.log('mixin beforeMount')
  },
  mounted() {
    console.log('mixin mounted')
  },
  beforeUpdate() {
    console.log('mixin beforeUpdate')
  },
  updated() {
    console.log('mixin updated')
  },
  beforeDestroy() {
    console.log('mixin beforeDestroy')
  },
  destroyed() {
    console.log('mixin destroyed')
  },
})

Vue.component('parent-component', {
  template: `<p class="parent">我是全局组件</p>`,
  beforeCreate() {
    console.log('parent beforeCreate')
  },
  created() {
    console.log('parent created')
  },
  beforeMount() {
    console.log('parent beforeMount')
  },
  mounted() {
    console.log('parent mounted')
  },
  beforeUpdate() {
    console.log('parent beforeUpdate')
  },
  updated() {
    console.log('parent updated')
  },
  beforeDestroy() {
    console.log('parent beforeDestroy')
  },
  destroyed() {
    console.log('parent destroyed')
  },
})

const vm = new Vue({
  el: '#app',
  components: {
    // TODO 局部组件没有创建对应的构造器，在数据更新时会重新渲染
    // TODO 文本中间的空格被移除了
    'child-component': {
      template: `
        <div class="child">
          <p>我是局部组件: {{ name }}</p>
          <p>下面的小东西</p>
        </div>
      `,
      data() {
        return {
          name: '哈哈哈',
        }
      },
      beforeCreate() {
        console.log('child beforeCreate')
      },
      created() {
        console.log('child created')
      },
      beforeMount() {
        console.log('child beforeMount')
      },
      mounted() {
        console.log('child mounted')
      },
      beforeUpdate() {
        console.log('child beforeUpdate')
      },
      updated() {
        console.log('child updated')
      },
      beforeDestroy() {
        console.log('child beforeDestroy')
      },
      destroyed() {
        console.log('child destroyed')
      },
    },
  },
  template: `
    <div id="vue">
      <h1 class="header">手写Vue</h1>
      <p class="name">{{ content }}</p>
      <p class="describe">爱好：{{ hobby.join('、') }}</p>
      <parent-component></parent-component>
      <child-component></child-component>
    </div>
  `,
  data() {
    return {
      name: '不羡鸳鸯',
      hobby: ['撸代码', '周杰伦', '王者荣耀'],
    }
  },
  computed: {
    content() {
      return `我的昵称是：${this.name}`
    },
  },
  watch: {
    name(newVal, oldVal) {
      console.log('name', newVal, oldVal)
    },
    // name: {
    //   handler(newVal, oldVal) {
    //     console.log('name', newVal, oldVal)
    //   },
    //   deep: true,
    //   immediate: true,
    // },
    // name: 'nameHandler', // TODO 未实现initMethods
    // name: [{
    //   handler(newVal, oldVal) {
    //     console.log('name', newVal, oldVal)
    //   },
    //   immediate: true,
    // }],
  },
  methods: {
    nameHandler(newVal, oldVal) {
      console.log('name', newVal, oldVal)
    }
  },
  beforeCreate() {
    console.log('beforeCreate')
  },
  created() {
    console.log('created')
  },
  beforeMount() {
    console.log('beforeMount')
  },
  mounted() {
    console.log('mounted')
  },
  beforeUpdate() {
    console.log('beforeUpdate')
  },
  updated() {
    console.log('updated')
  },
  beforeDestroy() {
    console.log('beforeDestroy')
  },
  destroyed() {
    console.log('destroyed')
  },
})

setTimeout(() => {
  vm.name = '不羡仙'
  vm.hobby.push('唱歌')
  vm.hobby[0] = '下班了'
  vm.hobby[1] = '周星驰'
}, 1000)
