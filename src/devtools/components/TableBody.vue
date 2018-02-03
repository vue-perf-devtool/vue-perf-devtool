<template>
  <div class="table-body">
    <slot></slot>
  </div>
</template>

<style lang="stylus" scoped>
@import "../variables"

.table-body
  display flex
  width 780px
  font-size 12px
  font-family Menlo, Consolas, monospace
  text-align center
  border-bottom 1px solid $border-color
  .column
    display flex
    align-items center
    font-weight 600
    flex-direction row
    justify-content center
    border-left 1px solid $border-color

</style>