<template>
  <section class="p-4">
    <div class="dashboard">
      <h1>Netlify Build Status Dashboard</h1>

      <div>
        <div v-if="loading">Loading...</div>

        <!-- a list of just the builds with errors -->
        <h2>Builds with Errors</h2>

        <div class="md:grid md:grid-cols-4 gap-4 space-y-2" v-for="site in sitesWithBuildErrors" :key="site.id">
          <RepoInfo :site="site" />
        </div>

        <!-- {{ sortedSites }} -->

        <transition-group name="fade" tag="div"
          class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-8 gap-1 md:gap-2 lg:gap-3" appear>
          <div v-for="site in sortedSites" :key="site.id" class="site-item flex flex-col align-center overflow-hidden">
            <RepoInfo :site="site" :show-deploys="true" />
          </div>
        </transition-group>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';

const data = ref([]);
const loading = ref(true);


const clipboardText = ref('');
const { text, copy, copied, isSupported } = useClipboard({ source: clipboardText })

function copyToClipboard(string) {
  clipboardText.value = string;
  copy();
}

const sortedSites = ref([])
const sitesWithBuildErrors = ref([])

// Fetch sites on component mount
onMounted(async () => {
  try {
    const sitesResponse = await fetch('/api/netlify');
    const sitesData = await sitesResponse.json();
    // const sitesWithDeploys = [];

    console.log(sitesData.data);

    for (const site of sitesData.data) {
      console.log(site);
      const deploysResponse = await fetch('/api/netlifyDeploys', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ siteId: site.id }),
      });
      const deploysData = await deploysResponse.json();
      const siteWithDeploys = { ...site, deploys: deploysData.data };
      // sitesWithDeploys.push(siteWithDeploys);
      data.value.push(siteWithDeploys);
      console.log(`Number of sites: ${data.value.length}`);

      // sort by last updated
      sortedSites.value = sortSitesByDate(data.value);

      // get the sites with build errors
      sitesWithBuildErrors.value = getSitesWithBuildErrors(data.value);
    }

    // data.value = sitesWithDeploys;
    loading.value = false;
  } catch (error) {
    console.error(error);
    loading.value = false;
  }
});

// const sortedSites = computed(() => {
//   if (!data.value) return [];
//   return data.value.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
// });

function sortSitesByDate(sites) {
  // return sites.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));

  // we want to be a little more advanced
  // if the site has a deploy, sort by the deploy date
  // if the site has no deploy, sort by the site updated_at date
  if (!sites) return [];

  if (sites.length === 0) return [];

  const sortedSites = sites.sort((a, b) => {
    if (a.deploys && a.deploys.length && b.deploys && b.deploys.length) {
      return new Date(b.deploys[0].created_at) - new Date(a.deploys[0].created_at);
    }

    if (a.deploys && a.deploys.length) {
      return new Date(b.updated_at) - new Date(a.deploys[0].created_at);
    }

    if (b.deploys && b.deploys.length) {
      return new Date(b.deploys[0].created_at) - new Date(a.updated_at);
    }

    return new Date(b.updated_at) - new Date(a.updated_at);
  });

  // always sort builds with errors to the top
  const sitesWithErrors = getSitesWithBuildErrors(sortedSites);

  // remove the sites with errors from the sorted list
  const sitesWithoutErrors = sortedSites.filter(site => !sitesWithErrors.includes(site));

  // return the sites with errors first, then the rest
  return [...sitesWithErrors, ...sitesWithoutErrors];

  return sortedSites;
}

// const sitesWithBuildErrors = computed(() => {
//   if (!data.value) return [];
//   const filtered = data.value.filter(site => site.deploys && site.deploys.length && site.deploys[0].state !== 'ready');

//   // sort by last updated
//   return filtered.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
// });

function getSitesWithBuildErrors(sites) {
  return sites.filter(site => site.deploys && site.deploys.length && site.deploys[0].state !== 'ready');
}




function getLatestDeployGithubRepo(site) {
  // get the most recent deploy
  const deploy = site.deploys[site.deploys.length - 1];

  // get the commit URL from the deploy
  const commitUrl = deploy.commit_url;

  // it looks like https://github.com/ejfox/electology/commit/a27bbaaf1f9d9fbf14
  // and we want to extract the username and repo name

  if (!commitUrl) return null;

  // split the URL by the slashes
  const parts = commitUrl.split('/');
  // get the username and repo name
  const username = parts[3];
  const repo = parts[4];

  return `${username}/${repo}`;
}
</script>

<style>
/* fade animation for vue */
.fade-move,
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s;
  opacity: 1;

}

.fade-enter,
.fade-leave-to {
  opacity: 0;
  transform: scale(0.2);
}

.fade-leave-active {
  position: absolute;
}
</style>
