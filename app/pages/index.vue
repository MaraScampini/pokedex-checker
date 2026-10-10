<script setup lang="ts">
import type { Entry } from '~~/shared/types'
import { genInfo } from '~~/shared/gens'

const { entries, loaded, load, setOwned } = useEntries()
const { show } = useToast()
const gen = usePersisted('gen', 1)
const sort = usePersisted<'dex' | 'az'>('sort', 'dex')
const missingOnly = usePersisted('missingOnly', false)
const q = useState('q', () => '')
// Locked by default so a stray tap at the shop can't change the list. Not
// saved on the device: every visit starts locked.
const marking = useState('marking', () => false)

onMounted(() => load().catch(() => {}))

const searching = computed(() => q.value.trim().length > 0)
// gen 0 shows every generation on one screen.
const allGens = computed(() => gen.value === 0)
const g = computed(() => genInfo(gen.value))
const label = computed(() => (allGens.value ? 'All generations' : `Gen ${g.value.roman}`))
const inGen = computed(() => (allGens.value ? entries.value : entries.value.filter((e) => e.gen === gen.value)))
const ownedCount = computed(() => inGen.value.filter((e) => e.owned).length)
const pct = computed(() => (inGen.value.length ? Math.round((ownedCount.value / inGen.value.length) * 100) : 0))

const items = computed(() => {
  // Search stays inside the current tab; the All tab searches everything.
  let list = searching.value ? inGen.value.filter((e) => matches(e, q.value)) : inGen.value
  if (missingOnly.value) list = list.filter((e) => !e.owned)
  if (sort.value === 'az') list = [...list].sort((a, b) => byName.compare(listName(a.name), listName(b.name)))
  return list
})
const indent = (e: Entry) => e.indent && sort.value === 'dex' && !searching.value

const popId = ref<number | null>(null)
function tap(e: Entry) {
  if (marking.value) toggle(e)
}

function toggle(e: Entry) {
  const owned = !e.owned
  setOwned(e, owned)
  popId.value = e.id
  // In the missing-only view the row disappears, so offer a way back.
  if (missingOnly.value && owned) {
    show(`Marked ${e.name} as owned`, 'info', { label: 'Undo', run: () => setOwned(e, false) })
  }
}

function pickGen(id: number) {
  gen.value = id
  window.scrollTo(0, 0)
}
</script>

<template>
  <div class="app">
    <div class="head">
      <div class="top">
        <span class="brand">Binder Dex</span>
        <ThemeButton />
        <button type="button" class="btn" :class="{ primary: marking }" :aria-pressed="marking" @click="marking = !marking">
          {{ marking ? 'Done' : 'Mark' }}
        </button>
        <NuxtLink class="btn" to="/edit">Edit list</NuxtLink>
      </div>
      <div v-if="marking" class="marking-bar" role="status">Marking is on. Tap to switch Have / Need.</div>
      <GenChips all :current="gen" @pick="pickGen" />
      <div class="tools">
        <div class="searchbox">
          <input
            id="q"
            v-model="q"
            class="field"
            type="search"
            :placeholder="allGens ? 'Search all: name or #' : `Search Gen ${g.roman}: name or #`"
            autocomplete="off"
            enterkeyhint="search"
            :aria-label="allGens ? 'Search every generation' : `Search Gen ${g.roman}`"
          >
          <button v-if="q" type="button" class="clear" aria-label="Clear search" @click="q = ''">✕</button>
        </div>
        <button type="button" class="toggle" :aria-pressed="missingOnly" @click="missingOnly = !missingOnly">
          Only missing
        </button>
      </div>
      <div class="sum">
        <span v-if="searching">{{ items.length }} result{{ items.length === 1 ? '' : 's' }} in {{ allGens ? 'every generation' : `Gen ${g.roman}` }}</span>
        <span v-else-if="allGens">All generations · I–IX</span>
        <span v-else>Gen {{ g.roman }} · {{ g.region }}</span>
        <div class="sum-right">
          <span v-if="!searching"><b>{{ ownedCount }}</b> / {{ inGen.length }}</span>
          <div class="seg" role="group" aria-label="Sort order">
            <button type="button" :aria-pressed="sort === 'dex'" @click="sort = 'dex'">No.</button>
            <button type="button" :aria-pressed="sort === 'az'" @click="sort = 'az'">A–Z</button>
          </div>
        </div>
        <div v-if="!searching" class="bar"><i :style="{ width: pct + '%' }" /></div>
      </div>
    </div>

    <div v-if="!loaded" class="loading">Loading your Pokédex…</div>
    <ol v-else class="list" :class="{ locked: !marking }">
      <li v-for="e in items" :key="e.id">
        <button
          type="button"
          class="row"
          :class="[e.owned ? 'own' : 'need', { form: indent(e), pop: popId === e.id }]"
          :aria-pressed="marking ? e.owned : undefined"
          :aria-disabled="!marking"
          @click="tap(e)"
          @animationend="popId = null"
        >
          <span class="box" aria-hidden="true" />
          <span class="no">{{ e.dex ? '#' + pad(e.dex) : '—' }}</span>
          <span class="nm">{{ listName(e.name) }}<small v-if="allGens">Gen {{ genInfo(e.gen).roman }}</small></span>
          <span class="st">{{ e.owned ? 'Have' : 'Need' }}</span>
        </button>
      </li>
      <li v-if="!items.length" class="empty">
        <template v-if="searching">No Pokémon in {{ allGens ? 'any generation' : `Gen ${g.roman}` }} match “{{ q.trim() }}”{{ missingOnly ? ' that you still need' : '' }}.<template v-if="!allGens"> Try the All tab.</template></template>
        <template v-else-if="missingOnly && inGen.length">Nothing missing. {{ label }} {{ allGens ? 'are' : 'is' }} complete.</template>
        <template v-else>{{ label }} {{ allGens ? 'have' : 'has' }} no Pokémon yet. Add them from Edit list.</template>
      </li>
    </ol>
  </div>
</template>
