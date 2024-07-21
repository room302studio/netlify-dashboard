<template>
  <div class="rounded-lg px-2 py-1 border border-gray-100 my-2">

    <!-- Domain and Name -->
    <div class="leading-none">
      <h2 v-if="site.custom_domain" class="text-primary-500 text-xl line-clamp-1">
        <a :href="site.url">{{ site?.custom_domain }}</a>
      </h2>
      <h3 v-else class="text-lg line-clamp-1">
        <a :href="site.url">{{ site.name }}</a>
      </h3>


      <!-- GitHub Repo and Admin Button -->
      <div class="flex flex-wrap items-center">
        <div class="flex items-center ">
          <UIcon name="i-mdi-github" />
          <span class="line-clamp-1">{{ getLatestDeployGithubRepo(site) }}</span>
        </div>
        <UButton :to="site.admin_url" color="primary" size="xs" variant="outline" class="w-full">Go To Admin</UButton>
      </div>
    </div>






    <!-- link to .deploy_url -->
    <div class="bg-blue-50 p-4 text-xs overflow-hidden flex flex-col my-1">
      <a :href="site.deploy_url" class="text-blue-200">{{ site.deploy_url }}</a>


      <!-- URL -->
      <a :href="site.url" class="text-blue-500">{{ site.url }}</a>
    </div>

    <!-- Latest Deploy Status -->
    <div v-if="site.deploys && site.deploys.length" class="space-y-1">
      <UAlert v-if="site.deploys[0].state !== 'ready'" icon="i-heroicons-exclamation-circle"
        description="There is an issue with the latest build." :title="site.deploys[0].state" type="error" class="my-4"
        color="red" />



      <div class="flex items-center space-x-1" v-if="site.deploys[0].state !== 'ready'">
        <strong>Latest Deploy Status:</strong>
        <UBadge :color="site.deploys[0].state === 'ready' ? 'green' : 'red'" variant="solid">
          {{ site.deploys[0].state }}
        </UBadge>
      </div>
      <div v-if="site.deploys[0].state !== 'ready'" class="text-red-500">⚠️ Build Issue!</div>
    </div>

    <!-- Publish and Update Info -->


    <!-- Published Deploy Info -->
    <div v-if="site.published_deploy" class="bg-gray-100 p-2 rounded space-y-3 my-1 text-sm shadow-sm">
      <UBadge color="purple" variant="solid">Latest Deploy</UBadge>

      <img :src="site.published_deploy.screenshot_url" class="w-full h-auto rounded border border-white shadow-md" />
      <div class="space-y-1">
        <p class="text-gray-800">{{ formatDate(site.updated_at) }} ({{ formatRelativeDate(site.updated_at)
          }})
        </p>

        <p class="text-gray-400 text-[10px] leading-3">
          <span class="text-gray-400 font-semibold text-[10px]">{{ site.published_deploy.committer }}</span>
          {{ site.published_deploy.title }}


        </p>

      </div>
    </div>



    <!-- Deploys List -->

    <!-- <UTable class="max-h-96" :columns="deployColumns" :rows="deployRows" /> -->

    <div v-if="site.deploys && site.deploys.length" class="space-y-2 border">

      <!-- <UTable :columns="deployColumns" :rows="deployRows" v-if="showDeploys">
        <template #state-data="{ row }">
          <span :class="row.state.class">{{ row.state.value }}</span>
        </template>
</UTable> -->

      <!-- just make a nicely formatted list with small text instead -->
      <div v-for="deploy in site.deploys.slice(0, 5)" :key="deploy.id"
        class="flex items-center space-x-2 text-sm border-b">
        <UBadge size="xs" :color="deploy.state === 'ready' ? 'green' : 'red'" variant="solid">{{ deploy.state }}
        </UBadge>
        <span class="text-gray-800 w-32 overflow-hiddent text-[10px] line-clamp-1">

          {{ shortFormatDate(deploy.published_at) }}
        </span>
        <!-- <span class="text-gray-400">{{ deploy.committer }}</span> -->
        <span class="text-gray-400 line-clamp-1">{{ deploy.title }}</span>
      </div>
    </div>

    <!-- Public Repo Info -->
    <div v-if="site.build_settings.public_repo && showDeploys" class="my-1">
      <UBadge color="yellow" variant="solid">Public Repo</UBadge>
      <span class="px-1 text-xs">{{ getLatestDeployGithubRepo(site) }}</span>
    </div>

    <!-- Error Message -->
    <div v-if="site.error_message">
      <UAlert icon="i-heroicons-exclamation-circle" :description="site.error_message" title="Error" type="error" />
    </div>




    <!-- Build Info -->
    <div v-if="site.build_settings.build_command || site.build_settings.base" class="build-info space-y-2">
      <div v-if="site.build_settings.build_command">
        <h2 class="text-lg text-gray-800">Build Command</h2>
        <pre class="bg-gray-100 p-1 rounded">{{ site.build_settings.build_command }}</pre>
      </div>
      <div v-if="site.build_settings.base">
        <h2 class="text-lg text-gray-800">Build Directory</h2>
        <pre class="bg-gray-100 p-1 rounded">{{ site.build_settings.base }}</pre>
      </div>
    </div>


    <!-- Site JSON -->
    <!-- <pre class="max-h-96 overflow-y-auto border rounded text-[10px] p-1 bg-gray-100">{{ site }}</pre> -->
    <UTooltip text="Copy site JSON" :shortcuts="['⌘', 'C']">
      <UButton @click="copyToClipboard(JSON.stringify(site))" size="xs" variant="ghost" color="purple">
        Copy site JSON
      </UButton>
    </UTooltip>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { format, formatDistanceToNow } from 'date-fns';

const props = defineProps({
  site: Object,
  showDeploys: { type: Boolean, default: false },
});


const source = ref('');
const { text, copy, copied, isSupported } = useClipboard({ source })

function copyToClipboard(string) {
  source.value = string;
  copy();
}


function getLatestDeployGithubRepo(site) {
  if (!site.deploys || !site.deploys.length) return null;
  const deploy = site.deploys[site.deploys.length - 1];
  const commitUrl = deploy.commit_url;
  if (!commitUrl) return null;
  const parts = commitUrl.split('/');
  const username = parts[3];
  const repo = parts[4];
  return `${username}/${repo}`;
}

function formatDate(date) {
  return date ? format(new Date(date), 'PPpp') : '';
}

function shortFormatDate(date) {
  return date ? format(new Date(date), 'PP') : '';
}

function formatRelativeDate(date) {
  return date ? formatDistanceToNow(new Date(date), { addSuffix: true }) : '';
}

// Define columns for UTable
const deployColumns = [
  { key: 'state', label: 'State' },
  { key: 'committer', label: 'Committer' },
  { key: 'title', label: 'Title' },

];

// Define rows for UTable with custom styles
const deployRows = computed(() =>
  props.site.deploys.slice(0, 5).map(deploy => ({
    state: {
      value: deploy.state,
      class: deploy.state === 'ready' ? 'text-green-500' : 'text-red-500',
    },
    title: deploy.title,
    committer: deploy.committer,
    framework: deploy.framework,
    screenshot: `<img src="${deploy.screenshot_url}" class="w-12 h-auto mt-2 rounded" />`,
  }))
);
</script>
