const { Routes } = require('./dist/routes');
const express = require('express');

const analysisController = { getAnalysis: () => {} };
const characterEncyclopediaController = { getEncyclopediasByGame: () => {} };
const metaController = { getLatestMetaReport: () => {} };

const r = new Routes(
  analysisController, {}, {}, {}, {}, characterEncyclopediaController, {}, metaController, {}, {}, {}, {}, {}, {}, {}
);
console.log("Public Routes attached:", !!r.publicRoutes);
