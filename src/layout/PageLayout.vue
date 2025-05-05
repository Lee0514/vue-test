<script setup lang="ts">
import { RouterView } from 'vue-router';
import Header from '@/components/Header.vue';
import Selector from '@/components/Selector.vue';
import Footer from '@/components/Footer.vue';
</script>

<template>
  <header>
    <div class="top-box">
      <div class="header">
        <Header />
      </div>
      <div class="selector">
        <Selector />
      </div>
    </div>
    <div class="wrapper pb-[7rem]">
      <router-view />
    </div>
    <div>
      <Footer />
    </div>
  </header>
</template>
