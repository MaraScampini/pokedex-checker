<script setup lang="ts">
import type { Entry } from '~~/shared/types'
import { genInfo } from '~~/shared/gens'

const { entries, loaded, load, setOwned } = useEntries()
const { show } = useToast()
const gen = usePersisted('gen', 1)
const sort = usePersisted<'dex' | 'az'>('sort', 'dex')
const missingOnly = usePersisted('missingOnly', false)
const q = useState('q', () => '')

onMounted(() => load().catch(() => {}))

const searching = computed(() => q.value.trim().length > 0)
const g = computed(() => genInfo(gen.value))
const inGen = computed(() => entries.value.filter((e) => e.gen === gen.value))
const ownedCount = computed(() => inGen.value.filter((e) => e.owned).length)
const pct = computed(() => (inGen.value.length ? Math.round((ownedCount.value / inGen.value.length) * 100) : 0))

// Regional forms are entries that repeat a Pokédex number already seen in
// their generation; they get indented under the base form.
const formIds = computed(() => {
  const seen = new Set<string>()
  const ids = new Set<number>()
  for (const e of entries.value) {
    if (e.dex == null) continue
    const key = `${e.gen}:${e.dex}`
    if (seen.has(key)) ids.add(e.id)
    else seen.add(key)
  }
  return ids
})

const items = computed(() => {
  let list = searching.value ? entries.value.filter((e) => matches(e, q.value)) : inGen.value
  if (missingOnly.value) list = list.filter((e) => !e.owned)
  if (sort.value === 'az') list = [...list].sort((a, b) => byName.compare(a.name, b.name))
  return list
})
const indent = (e: Entry) => sort.value === 'dex' && !searching.value && formIds.value.has(e.id)

const popId = ref<number | null>(null)
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
  q.value = ''
  window.scrollTo(0, 0)
}
</script>

<template>
  <div class="app">
    <div class="head">
      <div class="top">
        <span class="brand">Binder Dex</span>
        <ThemeButton />
        <NuxtLink class="btn" to="/edit">Edit list</NuxtLink>
      </div>
      <GenChips :current="searching ? 0 : gen" @pick="pickGen" />
      <div class="tools">
        <div class="searchbox">
          <input
            id="q"
            v-model="q"
            class="field"
            type="search"
            placeholder="Search name or #"
            autocomplete="off"
            enterkeyhint="search"
            aria-label="Search every generation"
          >
          <button v-if="q" type="button" class="clear" aria-label="Clear search" @click="q = ''">✕</button>
        </div>
        <button type="button" class="toggle" :aria-pressed="missingOnly" @click="missingOnly = !missingOnly">
          Only missing
        </button>
      </div>
      <div class="sum">
        <span v-if="searching">{{ items.length }} result{{ items.length === 1 ? '' : 's' }} in every generation</span>
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
    <ol v-else class="list">
      <li v-for="e in items" :key="e.id">
        <button
          type="button"
          class="row"
          :class="[e.owned ? 'own' : 'need', { form: indent(e), pop: popId === e.id }]"
          :aria-pressed="e.owned"
          @click="toggle(e)"
          @animationend="popId = null"
        >
          <span class="box" aria-hidden="true" />
          <span class="no">{{ e.dex ? '#' + pad(e.dex) : '—' }}</span>
          <span class="nm">{{ e.name }}<small v-if="searching">Gen {{ genInfo(e.gen).roman }}</small></span>
          <span class="st">{{ e.owned ? 'Have' : 'Need' }}</span>
        </button>
      </li>
      <li v-if="!items.length" class="empty">
        <template v-if="searching">No Pokémon match “{{ q.trim() }}”{{ missingOnly ? ' that you still need' : '' }}. Try the Pokédex number.</template>
        <template v-else-if="missingOnly && inGen.length">Nothing missing. Gen {{ g.roman }} is complete.</template>
        <template v-else>Gen {{ g.roman }} has no Pokémon yet. Add them from Edit list.</template>
      </li>
    </ol>
  </div>
</template>
