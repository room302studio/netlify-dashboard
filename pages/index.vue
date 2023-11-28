<template>
  <section class="p-4">
    <div class="dashboard">
      <h1>Netlify Build Status Dashboard</h1>
      <div v-if="loading">Loading...</div>
      <div v-else>

        <!-- a list of just the builds with errors -->
        <h2>Builds with Errors</h2>
        <div class="flex flex-wrap">
          <div class="grid grid-cols-4 gap-4">
            <UCard v-for="site in sitesWithBuildErrors" :key="site.id" class="site-item">
              <!-- the name of the site -->
              <h2 class="text-xl my-2">{{ site.name }}</h2>
              <!-- details on the build error -->
              <p><strong>Latest Deploy Status:</strong> <span :class="{ 'error': site.deploys[0].state !== 'ready' }">{{
                site.deploys[0].state }}</span></p>
              <p v-if="site.deploys[0].state !== 'ready'">⚠️ Build Issue!</p>
              <p><strong>Deploy Log:</strong> <a :href="site.deploys[0].log_access_attributes.url" target="_blank">View
                  Logs</a></p>

              <!-- the linked github repo, if available -->
              <p v-if="site.build_settings.public_repo">
                <a :href="site.build_settings.repo_url" target="_blank" class="text-xs font-mono">{{
                  site.build_settings.repo_url }}</a>
              </p>
            </UCard>
          </div>
        </div>

        <UDivider class="my-24" />

        <ul class="flex flex-wrap">
          <div v-for="site in sortedSites" :key="site.id" class="site-item w-1/2 p-2 flex flex-col align-center">
            <UCard>
              <h2 class="text-xl">{{ site.name }}</h2>
              <p><strong>Last Updated:</strong> {{ new Date(site.updated_at).toLocaleString() }}</p>
              <!-- <p>
                <img :src="site?.published_deploy?.screenshot_url" />
              </p> -->

              <!-- Display the latest deploy status -->
              <div v-if="site.deploys && site.deploys.length">
                <p><strong>Latest Deploy Status:</strong> <span :class="{ 'error': site.deploys[0].state !== 'ready' }">{{
                  site.deploys[0].state }}</span></p>
                <p v-if="site.deploys[0].state !== 'ready'">⚠️ Build Issue!</p>
                <p><strong>Deploy Log:</strong> <a :href="site.deploys[0].log_access_attributes.url" target="_blank">View
                    Logs</a></p>
              </div>

              <h3>{{ site.custom_domain }}</h3>
              <p>Public: {{ site.build_settings.public_repo }}</p>
              <p><strong>URL:</strong> <a :href="site.url" class="text-xs font-mono">{{ site.url }}</a></p>
              <!-- <p><strong>Admin URL:</strong> <a :href="site.admin_url">{{ site.admin_url }}</a></p> -->
            </UCard>
          </div>
        </ul>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';

const data = ref(null);
const loading = ref(true);

// Fetch sites on component mount
onMounted(async () => {
  const sitesResponse = await fetch('/api/netlify');
  const sitesData = await sitesResponse.json();
  data.value = await Promise.all(sitesData.data.map(async site => {
    const deploysResponse = await fetch('/api/netlifyDeploys', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ siteId: site.id }),
    });
    const deploysData = await deploysResponse.json();
    return { ...site, deploys: deploysData.data };
  }));
  loading.value = false;
});

const sortedSites = computed(() => {
  if (!data.value) return [];
  return data.value.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
});

const sitesWithBuildErrors = computed(() => {
  if (!data.value) return [];
  const filtered = data.value.filter(site => site.deploys && site.deploys.length && site.deploys[0].state !== 'ready');

  // sort by last updated
  return filtered.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
});
</script>

<style>
.error {
  color: red;
}
</style>
