import { defineAction } from 'astro:actions';
import { subscribe } from './subscribe';

export const server = {
  subscribe,
};