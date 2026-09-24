// @vitest-environment happy-dom
import {afterEach, expect, it} from 'vitest';
import {cleanup, fireEvent, render, screen} from '@testing-library/react';
import {existsSync} from 'node:fs';
import {HarbourArt, harbourArtUrl} from '../src/HarbourArt';
import {PORTS} from '../src/world';

afterEach(cleanup);

it('ships both image sizes for every town under the configured Pages base',()=>{
  for (const town of PORTS) for (const size of [640,1280] as const) {
    expect(existsSync(`public/images/harbours/${town.id}-${size}.webp`)).toBe(true);
    expect(harbourArtUrl(town.id,size)).toBe(`/caribbean-captain/images/harbours/${town.id}-${size}.webp`);
  }
});

it('recovers from a failed image when entering another harbour',()=>{
  const view=render(<HarbourArt id="bridgetown"/>);
  fireEvent.error(screen.getByRole('img'));
  expect(screen.queryByRole('img')).toBeNull();
  view.rerender(<HarbourArt id="tortuga"/>);
  const image=screen.getByRole('img',{name:'Painted view of Tortuga harbour, Tortuga'});
  expect(image.getAttribute('src')).toContain('/tortuga-1280.webp');
  expect(image.getAttribute('srcset')).toContain('/tortuga-640.webp 640w');
});
