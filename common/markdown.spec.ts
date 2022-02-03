import { getSection } from './markdown';
import { demargin } from './string/string';

describe('getSection', () => {
  it('gets a section', () => {
    const section = getSection(["Foo"], demargin`
      # Foo

      bar
    `)
    expect(section).toEqual(demargin`
      # Foo

      bar`);
  });

  it('gets a section (alt style)', () => {
    const section = getSection(["Foo"], demargin`
      Foo
      ===

      bar
    `)
    expect(section).toEqual(demargin`
      Foo
      ===

      bar`);
  });

  it('gets a section with sections after it', () => {
    const section = getSection(["Foo"], demargin`
      # Foo

      bar

      # Bagel

      potato
    `)
    expect(section).toEqual(demargin`
      # Foo

      bar`);
  });

  it('gets a section with sections after it (smushed)', () => {
    const section = getSection(["Foo"], demargin`
      # Foo
      bar
      # Bagel
      potato
    `)
    expect(section).toEqual(demargin`
      # Foo
      bar`);
  });

  it('gets a nested section', () => {
    const section = getSection(["Foo 2", "Bagel"], demargin`
      # Foo
      bar

      ## Bagel

      wrong section

      # Foo 2

      ## Bagel

      yeet
    `)
    expect(section).toEqual(demargin`
      ## Bagel

      yeet`);
  });

  it('gets a nested section (alt style)', () => {
    const section = getSection(["Foo 2", "Bagel"], demargin`
      Foo
      ===

      bar

      Bagel
      -----

      wrong section

      Foo 2
      =====

      Bagel
      -----

      yeet
    `)
    expect(section).toEqual(demargin`
      Bagel
      -----

      yeet`);
  });

  it('gets a nested section with sections after it', () => {
    const section = getSection(["Foo 2", "Bagel"], demargin`
      # Foo
      bar

      # Foo 2

      ## Bagel

      potato

      sweet potato

      ## Carrot
      celery

      # Rutabaga

      yeet
    `)
    expect(section).toEqual(demargin`
      ## Bagel

      potato

      sweet potato`);
  });

  it('gets a nested section with sections after it (alt style)', () => {
    const section = getSection(["Foo 2", "Bagel"], demargin`
      Foo
      ===

      bar

      Foo 2
      =====

      Bagel
      -----

      potato

      sweet potato

      Carrot
      ------

      celery

      Rutabaga
      ========

      yeet
    `)
    expect(section).toEqual(demargin`
      Bagel
      -----

      potato

      sweet potato`);
  });

  it('gets a nested section with further nesting in it', () => {
    const section = getSection(["Foo 2", "Bagel"], demargin`
      # Foo
      bar

      # Foo 2

      ## Bagel

      potato

      ### Yeet

      yeetloaf

      ## Carrot
      celery

      # Rutabaga

      yeet
    `)
    expect(section).toEqual(demargin`
      ## Bagel

      potato

      ### Yeet

      yeetloaf`);
  });
});
