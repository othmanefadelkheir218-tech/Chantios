import 'reflect-metadata';
import { AppModule } from './app.module';

type ModuleRefLike = { forwardRef?: () => unknown; name?: string };
type Ctor = { name: string };

const meta = <T>(key: string, target: unknown): T[] =>
  (Reflect.getMetadata(key, target as object) as T[] | undefined) ?? [];

/**
 * A module-import cycle between files leaves an `imports` entry `undefined`
 * when Node loads them, and Nest then refuses to start ("The module at index
 * [n] of the XModule imports array is undefined"). This finds it without
 * starting the API: it walks every module from `AppModule`.
 */
describe('AppModule wiring', () => {
  it('no module import and no constructor argument is undefined', () => {
    const seen = new Set<unknown>();
    const problems: string[] = [];

    const walk = (entry: unknown, path: string) => {
      const ref = entry as ModuleRefLike;
      const mod = ref.forwardRef ? ref.forwardRef() : entry;
      if (!mod || seen.has(mod)) return;
      seen.add(mod);
      const here = `${path} -> ${(mod as ModuleRefLike).name ?? '?'}`;

      const imports = meta<unknown>('imports', mod);
      imports.forEach((imp, i) => {
        if (imp === undefined)
          problems.push(`${here} imports[${i}] is undefined`);
      });

      const classes = [
        ...meta<unknown>('providers', mod),
        ...meta<unknown>('controllers', mod),
      ];
      for (const cls of classes) {
        if (typeof cls !== 'function') continue;
        const injected = meta<{ index: number }>('self:paramtypes', cls);
        meta<unknown>('design:paramtypes', cls).forEach((type, i) => {
          if (type === undefined && !injected.some((x) => x.index === i)) {
            problems.push(
              `${(cls as Ctor).name} constructor argument [${i}] is undefined`,
            );
          }
        });
      }
      imports.forEach((imp) => imp !== undefined && walk(imp, here));
    };

    walk(AppModule, 'App');
    expect(problems).toEqual([]);
    expect(seen.size).toBeGreaterThan(50);
  });
});
