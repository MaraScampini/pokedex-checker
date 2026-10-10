<script setup lang="ts">
import type { Entry } from '~~/shared/types'
import { genInfo } from '~~/shared/gens'

const { entries, loaded, load, rename, move, add, remove, reset } = useEntries()
const { show } = useToast()
const gen = usePersisted('editGen', usePersisted('gen', 1).value)
const name = ref('')
const position = ref<number | ''>('')
const filter = ref('')
const confirmId = ref<number | null>(null)
const busy = ref(false)

onMounted(() => load().catch(() => {}))

const g = computed(() => genInfo(gen.value))
const inGen = computed(() => entries.value.filter((e) => e.gen === gen.value))
const shown = computed(() => (filter.value.trim() ? inGen.value.filter((e) => matches(e, filter.value)) : inGen.value))
const last = computed(() => inGen.value.length + 1)

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
    const created = await add(gen.value, n, position.value === '' ? undefined : Number(position.value))
    show(`Added ${created.name} at position ${created.position}`)
    name.value = ''
    position.value = ''
    filter.value = ''
    await nextTick()
    document.getElementById(`entry-${created.id}`)?.scrollIntoView({ block: 'center', behavior: 'smooth' })
  })
}

function onRename(e: Entry, ev: Event) {
  const input = ev.target as HTMLInputElement
  const v = input.value.trim()
  if (!v || v === e.name) return (input.value = e.name)
  run(() => rename(e, v).catch((err) => { input.value = e.name; throw err }))
}

function onPosition(e: Entry, ev: Event) {
  const input = ev.target as HTMLInputElement
  const p = Number(input.value)
  if (!Number.isInteger(p) || p < 1 || p === e.position) return (input.value = String(e.position))
  run(() => move(e, Math.min(p, inGen.value.length)))
}

function onDelete(e: Entry) {
  if (confirmId.value !== e.id) return (confirmId.value = e.id)
  confirmId.value = null
  run(async () => {
    await remove(e)
    show(`Removed ${e.name}`)
  })
}

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
    </div>
    <form class="add" @submit.prevent="submit">
        <div class="add-h">Add to Gen {{ g.roman }} · {{ g.region }}</div>
        <input id="add-name" v-model="name" class="field" placeholder="Name, e.g. Galarian Meowth" autocomplete="off" aria-label="Name">
        <input
          id="add-pos"
          v-model="position"
          class="field"
          type="number"
          inputmode="numeric"
          min="1"
          :max="last"
          :placeholder="String(last)"
          aria-label="Position"
        >
        <button class="btn primary" type="submit" :disabled="busy">Add</button>
        <p class="hint">Position 1 to {{ last }}. Leave it empty to add at the end.</p>
      </form>
      <div class="tools">
        <input id="filter" v-model="filter" class="field" type="search" :placeholder="`Find in Gen ${g.roman}`" autocomplete="off" aria-label="Find in this generation">
    </div>

    <div v-if="!loaded" class="loading">Loading the list…</div>
    <template v-else>
      <ol class="alist">
        <li v-for="e in shown" :id="`entry-${e.id}`" :key="e.id" class="arow">
          <input
            class="inline pos"
            type="number"
            inputmode="numeric"
            min="1"
            :max="inGen.length"
            :value="e.position"
            :aria-label="`Position of ${e.name}`"
            @change="onPosition(e, $event)"
            @keydown.enter="($event.target as HTMLInputElement).blur()"
          >
          <span class="no">{{ e.dex ? pad(e.dex) : '—' }}</span>
          <input
            class="inline"
            :value="e.name"
            :aria-label="`Name of entry ${e.position}`"
            autocomplete="off"
            @change="onRename(e, $event)"
            @keydown.enter="($event.target as HTMLInputElement).blur()"
          >
          <span class="ctrls">
            <button type="button" :disabled="busy || e.position === 1" aria-label="Move up" @click="run(() => move(e, e.position - 1))">↑</button>
            <button type="button" :disabled="busy || e.position === inGen.length" aria-label="Move down" @click="run(() => move(e, e.position + 1))">↓</button>
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
          {{ filter.trim() ? `Nothing in Gen ${g.roman} matches “${filter.trim()}”.` : `Gen ${g.roman} is empty. Add the first Pokémon above.` }}
        </li>
      </ol>
      <div class="foot"><button type="button" class="btn" @click="signOut">Sign out</button></div>
    </template>
  </div>
</template>
