# Reference Types Catalog

This document catalogs the types of references to search for during Phase 2 (Direct Dependency Mapping) of the refactor-analysis skill. For each refactor target, search for all applicable reference types below.

---

## Universal References (All Languages)

| Reference Type | Search Pattern | Example |
|---|---|---|
| **Import/require** | `import.*<target>`, `require.*<target>`, `from.*<target>` | `import { Foo } from './foo'` |
| **Re-export** | `export.*from.*<target>` | `export { Foo } from './foo'` |
| **String literal** | `"<target>"`, `'<target>'`, `` `<target>` `` | Dynamic imports, config values |
| **Comment/doc reference** | `@see <target>`, `@link <target>` | JSDoc, Javadoc references |

## Type System References

| Reference Type | Search Pattern | Example |
|---|---|---|
| **Type annotation** | `: <target>`, `<target>[]`, `<target> \|` | `const x: Foo = ...` |
| **Generic parameter** | `<target>>`, `<<target>,` | `Promise<Foo>` |
| **Extends/implements** | `extends <target>`, `implements <target>` | `class Bar extends Foo` |
| **Type alias** | `type.*=.*<target>` | `type MyType = Foo & Bar` |
| **Interface merge** | `interface <target>` (same name, different file) | Declaration merging |

## Function/Method References

| Reference Type | Search Pattern | Example |
|---|---|---|
| **Direct call** | `<target>(` | `doStuff()` |
| **Method call** | `.<target>(` | `obj.doStuff()` |
| **Callback/handler** | `= <target>`, `(<target>)` | `onClick={handleClick}` |
| **Decorator** | `@<target>` | `@Injectable()` |

## Configuration References

| Reference Type | Where to Search | Example |
|---|---|---|
| **Build config** | `webpack.config.*`, `vite.config.*`, `tsconfig.json`, `rollup.config.*` | Aliases, entry points |
| **Package manifest** | `package.json` (main, exports, bin, scripts) | Entry point paths |
| **DI container** | Framework-specific config files | Service registration |
| **Route config** | Router files, route definitions | Route-to-component mapping |
| **CI/CD config** | `.github/workflows/*`, `.gitlab-ci.yml`, `Jenkinsfile` | Build/test references |
| **Database schemas** | Migration files, ORM models, schema definitions | Table/column names |
| **Environment config** | `.env*`, `docker-compose.*`, `Dockerfile` | Service names, paths |

## Framework-Specific References

### React / Next.js

| Reference Type | Search Pattern |
|---|---|
| **JSX usage** | `<Target`, `<Target>`, `<Target />` |
| **Context provider/consumer** | `<TargetContext.Provider`, `useContext(TargetContext)` |
| **Hook usage** | `useTarget(` |
| **Dynamic import** | `dynamic(() => import('<target>'))`, `lazy(() => import('<target>'))` |
| **Next.js routes** | File path in `app/` or `pages/` directory |

### Angular

| Reference Type | Search Pattern |
|---|---|
| **Module imports** | `imports: [...Target]` in `@NgModule` |
| **Component selector** | `<app-target>`, `selector: 'app-target'` |
| **Service injection** | `constructor(private target: TargetService)` |
| **Template reference** | `#target`, `[target]`, `(target)` |

### Vue

| Reference Type | Search Pattern |
|---|---|
| **Component registration** | `components: { Target }` |
| **Template usage** | `<Target`, `<target-name` |
| **Composable usage** | `useTarget(` |

### Python

| Reference Type | Search Pattern |
|---|---|
| **from import** | `from <module> import <target>` |
| **Dotted access** | `<module>.<target>` |
| **Django URLs** | `path('...', <target>)` |
| **SQLAlchemy** | `ForeignKey('<target>')`, `relationship('<target>')` |

### .NET / C#

| Reference Type | Search Pattern |
|---|---|
| **Using directive** | `using <namespace>` |
| **Namespace reference** | `<namespace>.<target>` |
| **DI registration** | `services.Add*<Target>()` |
| **Attribute** | `[Target]`, `[Target(...)]` |
| **Project reference** | `<ProjectReference Include="<target>">` in `.csproj` |

## Test-Specific References

| Reference Type | Where to Search | Example |
|---|---|---|
| **Test subject import** | Test files (`*.test.*`, `*.spec.*`, `__tests__/*`) | `import { Foo } from '../foo'` |
| **Mock/stub** | `jest.mock('<target>')`, `vi.mock('<target>')`, `unittest.mock.patch('<target>')` | Mock declarations |
| **Fixture data** | Test fixture files, `__fixtures__/*` | References to target in test data |
| **Snapshot** | `*.snap` files | Serialized component output |
| **Test description** | `describe('<target>'`, `it('...target...'` | Test naming |

## Hard-to-Find References

These are the references most likely to be missed. Pay extra attention to these:

| Reference Type | Why It's Hard | Mitigation |
|---|---|---|
| **String-based dynamic import** | Not statically analyzable | Search for string literals matching target name |
| **Reflection/metaprogramming** | Runtime resolution | Search for target name as string in all files |
| **Convention-based discovery** | No explicit reference | Check framework conventions (file naming, directory structure) |
| **Barrel exports (index files)** | Indirect reference chain | Check all index.ts/index.js for re-exports |
| **Database stored procedures** | Outside codebase | Search SQL/migration files |
| **External API consumers** | Outside codebase | Flag as risk — cannot analyze |
| **Serialized references** | In data files | Search JSON, YAML, XML for target name |
