<template>
  <section>
    <div class="dashboard">
      <h1>Netlify Build Status Dashboard</h1>
      <div v-if="loading">Loading...</div>
      <div v-else>
        <ul class="flex flex-wrap">
          <UCard v-for="site in sortedSites" :key="site.id" class="site-item w-1/2">
            <h2 class="text-xl my-2">{{ site.name }}</h2>
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
            <p><strong>URL:</strong> <a :href="site.url">{{ site.url }}</a></p>
            <!-- <p><strong>Admin URL:</strong> <a :href="site.admin_url">{{ site.admin_url }}</a></p> -->

          </UCard>
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
</script>

<style>
.error {
  color: red;
}
</style>
