<script setup lang="ts">
import Sortable from 'sortablejs'
import type { Entry } from '~~/shared/types'
import { genInfo } from '~~/shared/gens'

const { entries, loaded, load, update, move, add, remove, reset } = useEntries()
const { show } = useToast()
const gen = usePersisted('editGen', usePersisted('gen', 1).value)
const name = ref('')
const dex = ref<number | ''>('')
const position = ref<number | ''>('')
const indent = ref(false)
const filter = ref('')
const confirmId = ref<number | null>(null)
const busy = ref(false)
const listEl = ref<HTMLElement | null>(null)

onMounted(() => load().catch(() => {}))

const g = computed(() => genInfo(gen.value))
const inGen = computed(() => entries.value.filter((e) => e.gen === gen.value))
const filtering = computed(() => filter.value.trim().length > 0)
const shown = computed(() => (filtering.value ? inGen.value.filter((e) => matches(e, filter.value)) : inGen.value))
const last = computed(() => inGen.value.length + 1)

// Drag and drop by the dotted handle. Sortable moves the DOM node itself;
// put it back and let Vue re-render from the reordered data instead.
let sortable: Sortable | null = null
watch(listEl, (el) => {
  sortable?.destroy()
  sortable = el
    ? Sortable.create(el, {
        handle: '.handle',
        animation: 150,
        ghostClass: 'drag-ghost',
        chosenClass: 'drag-chosen',
        scroll: true,
        scrollSensitivity: 90,
        scrollSpeed: 14,
        onEnd({ item, from, oldIndex, newIndex }) {
          if (oldIndex == null || newIndex == null || oldIndex === newIndex) return
          from.removeChild(item)
          from.insertBefore(item, from.children[oldIndex] ?? null)
          const e = shown.value[oldIndex]
          if (e) move(e, newIndex + 1)
        }
      })
    : null
}, { flush: 'post' })
onBeforeUnmount(() => sortable?.destroy())

function pickGen(id: number) {
  gen.value = id
  filter.value = ''
  confirmId.value = null
  window.scrollTo(0, 0)
}

async function run(task: () => Promise<unknown>) {
  if (busy.value) return
  busy.value = true
  try { await task() } catch {} finally { busy.value = false }
}

function submit() {
  const n = name.value.trim()
  if (!n) return show('Type a name to add.', 'error')
  run(async () => {
    const created = await add({
      gen: gen.value,
      name: n,
      dex: dex.value === '' ? null : Number(dex.value),
      indent: indent.value,
      position: position.value === '' ? undefined : Number(position.value)
    })
    show(`Added ${created.name} at position ${created.position}`)
    name.value = ''
    dex.value = ''
    position.value = ''
    indent.value = false
    filter.value = ''
    await nextTick()
    document.getElementById(`entry-${created.id}`)?.scrollIntoView({ block: 'center', behavior: 'smooth' })
  })
}

function onName(e: Entry, ev: Event) {
  const input = ev.target as HTMLInputElement
  const v = input.value.trim()
  if (!v || v === e.name) return (input.value = e.name)
  run(() => update(e, { name: v }).catch((err) => { input.value = e.name; throw err }))
}

function onDex(e: Entry, ev: Event) {
  const input = ev.target as HTMLInputElement
  const raw = input.value.trim()
  const v = raw === '' ? null : Number(raw)
  if (v === e.dex) return
  if (v !== null && (!Number.isInteger(v) || v < 1)) return (input.value = e.dex == null ? '' : String(e.dex))
  run(() => update(e, { dex: v }).catch((err) => { input.value = e.dex == null ? '' : String(e.dex); throw err }))
}

function onPosition(e: Entry, ev: Event) {
  const input = ev.target as HTMLInputElement
  const p = Number(input.value)
  if (!Number.isInteger(p) || p < 1 || p === e.position) return (input.value = String(e.position))
  move(e, p)
}

function onDelete(e: Entry) {
  if (confirmId.value !== e.id) return (confirmId.value = e.id)
  confirmId.value = null
  run(async () => {
    await remove(e)
    show(`Removed ${e.name}`)
  })
}

const blurOnEnter = (ev: KeyboardEvent) => (ev.target as HTMLInputElement).blur()

async function signOut() {
  await $fetch('/api/logout', { method: 'POST' }).catch(() => {})
  useState('signedIn').value = false
  reset()
  await navigateTo('/login')
}
</script>

<template>
  <div class="app">
    <div class="head">
      <div class="top">
        <NuxtLink class="btn" to="/">← Done</NuxtLink>
        <span class="brand" style="margin-left: 4px">Edit list</span>
        <ThemeButton />
      </div>
      <GenChips :current="gen" @pick="pickGen" />
      <form class="add" @submit.prevent="submit">
        <input
          id="add-name"
          v-model="name"
          class="field add-name"
          :placeholder="`Add to Gen ${g.roman}: name`"
          autocomplete="off"
          aria-label="Name"
        >
        <input id="add-dex" v-model="dex" class="field" type="number" inputmode="numeric" min="1" placeholder="No." aria-label="Pokédex number (optional)">
        <input
          id="add-pos"
          v-model="position"
          class="field"
          type="number"
          inputmode="numeric"
          min="1"
          :max="last"
          placeholder="Pos."
          :aria-label="`Position, 1 to ${last}. Empty adds at the end.`"
        >
        <button type="button" class="toggle" :aria-pressed="indent" @click="indent = !indent">↳ Indent</button>
        <button class="btn primary" type="submit" :disabled="busy">Add</button>
      </form>
    </div>

    <div class="tools edit-tools">
      <input id="filter" v-model="filter" class="field" type="search" :placeholder="`Find in Gen ${g.roman}`" autocomplete="off" aria-label="Find in this generation">
    </div>
    <p class="ahint">
      {{ inGen.length }} entries. Drag <span class="handle-sample" aria-hidden="true" /> to reorder.
      Leave Pos. empty to add at the end.
      <template v-if="filtering"> Clear the search to drag.</template>
    </p>

    <div v-if="!loaded" class="loading">Loading the list…</div>
    <template v-else>
      <div class="acols" aria-hidden="true"><span /><span>Pos.</span><span>No.</span><span>Name</span><span>Indent · Remove</span></div>
      <ol ref="listEl" class="alist">
        <li v-for="e in shown" :id="`entry-${e.id}`" :key="e.id" class="arow" :class="{ indented: e.indent }">
          <span v-if="!filtering" class="handle" :title="`Drag to move ${e.name}`" aria-hidden="true" />
          <span v-else class="handle off" aria-hidden="true" />
          <input
            class="inline pos"
            type="number"
            inputmode="numeric"
            min="1"
            :max="inGen.length"
            :value="e.position"
            :aria-label="`Position of ${e.name}`"
            @change="onPosition(e, $event)"
            @keydown.enter="blurOnEnter"
          >
          <input
            class="inline no"
            type="number"
            inputmode="numeric"
            min="1"
            placeholder="—"
            :value="e.dex ?? ''"
            :aria-label="`Pokédex number of ${e.name}`"
            @change="onDex(e, $event)"
            @keydown.enter="blurOnEnter"
          >
          <input
            class="inline"
            :value="e.name"
            :aria-label="`Name of entry ${e.position}`"
            autocomplete="off"
            @change="onName(e, $event)"
            @keydown.enter="blurOnEnter"
          >
          <span class="ctrls">
            <button
              type="button"
              class="ind"
              :aria-pressed="e.indent"
              :disabled="busy"
              :aria-label="e.indent ? `Stop indenting ${e.name}` : `Indent ${e.name}`"
              :title="e.indent ? 'Indented' : 'Indent'"
              @click="run(() => update(e, { indent: !e.indent }))"
            >↳</button>
            <button
              type="button"
              class="del"
              :class="{ confirm: confirmId === e.id }"
              :disabled="busy"
              :aria-label="confirmId === e.id ? `Confirm removing ${e.name}` : `Remove ${e.name}`"
              @click="onDelete(e)"
              @blur="confirmId === e.id && (confirmId = null)"
            >{{ confirmId === e.id ? 'Remove?' : '✕' }}</button>
          </span>
        </li>
        <li v-if="!shown.length" class="empty">
          {{ filtering ? `Nothing in Gen ${g.roman} matches “${filter.trim()}”.` : `Gen ${g.roman} is empty. Add the first Pokémon above.` }}
        </li>
      </ol>
      <div class="foot"><button type="button" class="btn" @click="signOut">Sign out</button></div>
    </template>
  </div>
</template>
