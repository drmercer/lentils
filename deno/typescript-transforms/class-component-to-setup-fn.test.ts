import { transform } from './class-component-to-setup-fn.ts';
import { assertEquals } from "https://deno.land/std@0.93.0/testing/asserts.ts";
import { src } from '../testutils.ts';

Deno.test("it should work", () => {
  const input = src`
<template>
  <div class="internal-link-flow">
    <SearchNotes
      :density="'cozy'"
      :showHome="false"
      @note-clicked="noteChosen($event)"
    />
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';
import { Entry } from '../../../../common/types/entry';
import SearchNotes from '../display/searchnotes.vue';

@Component({
  components: {
    SearchNotes,
  },
})
export default class InternalLinkFlow extends Vue {
  @DmInject private appRouter!: AppRouter;

  @Prop() private yeet!: number;
  @Prop() private yeet2!: 'foo'|'bar';

  public get bagel(): string {
    return 'everything';
  }

  // Foo
  public foo: string = 'yeet';

  private noteChosen(note: Entry) {
    this.$emit('note-chosen', note.path);
    console.log(this.appRouter, this.foo);
  }
}
</script>

<style lang="less" scoped>

</style>
  `;
  const actual = src(transform(input.text));
  const expected = src`
<template>
  <div class="internal-link-flow">
    <SearchNotes
      :density="'cozy'"
      :showHome="false"
      @note-clicked="noteChosen($event)"
    />
  </div>
</template>

<script lang="ts">
import { Ref, computed, defineComponent, ref } from '@vue/composition-api';
import { Entry } from '../../../../common/types/entry';
import SearchNotes from '../display/searchnotes.vue';

export default defineComponent({
  components: {
    SearchNotes,
  },
  props: {
    yeet: {
      type: Number,
    },
    yeet2: {
      type: String as () => 'foo'|'bar',
    },
  },
  setup(props, {emit}) {
    const appRouter = dmInject(AppRouter);

    const yeet: Ref<number> = computed(() => props.yeet);

    const yeet2: Ref<'foo'|'bar'> = computed(() => props.yeet2);

    const bagel: Ref<string> = computed(() => {
      return 'everything';
    });

    // Foo
    const foo: Ref<string> = ref('yeet');

    function noteChosen(note: Entry) {
      emit('note-chosen', note.path);
      console.log(appRouter, foo.value);
    }

    return {
      appRouter,
      bagel,
      foo,
      noteChosen,
      yeet,
      yeet2,
    };
  },
});
</script>

<style lang="less" scoped>

</style>
  `;
  assertEquals(actual, expected);
});

Deno.test("it should only include the necessary imports", () => {
  const input = src`
<template>
  <div class="yeet">
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';

@Component({
})
export default class Yeet extends Vue {
  private hello() {
    console.log("Hello");
  }
}
</script>

<style lang="less" scoped>
</style>
  `;
  const actual = src(transform(input.text));
  const expected = src`
<template>
  <div class="yeet">
  </div>
</template>

<script lang="ts">
import { defineComponent } from '@vue/composition-api';

export default defineComponent({
  setup(props, {emit}) {
    function hello() {
      console.log("Hello");
    }

    return {
      hello,
    };
  },
});
</script>

<style lang="less" scoped>
</style>
  `;
  assertEquals(actual, expected);
});
