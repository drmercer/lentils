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
  private noteChosen(note: Entry) {
    this.$emit('note-chosen', note.path);
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
import { defineComponent, ref, Ref, computed } from '@vue/composition-api';
import { Entry } from '../../../../common/types/entry';
import SearchNotes from '../display/searchnotes.vue';

export default defineComponent({
  components: {
    SearchNotes,
  },
  setup(props, {emit}) {
    function noteChosen(note: Entry) {
      emit('note-chosen', note.path);
    }

    return {
      noteChosen,
    };
  },
});
</script>

<style lang="less" scoped>

</style>
  `;
  assertEquals(actual, expected);
});
