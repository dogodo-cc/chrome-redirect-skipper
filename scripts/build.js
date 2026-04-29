import { readFile, writeFile, rm, copyFile, cp, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { exec } from 'node:child_process';

const root = process.cwd();

const args = process.argv.slice(2);
const isChrome = args.includes('--chrome');
const isFirefox = args.includes('--firefox');

if (!isChrome && !isFirefox) {
    console.error('Please specify --chrome or --firefox');
    process.exit(1);
}

const distDir = isChrome ? 'dist-chrome' : 'dist-firefox';
const distPath = join(root, distDir);
const zipName = isChrome ? 'redirect-skipper-chrome.zip' : 'redirect-skipper-firefox.zip';

(async function () {
    await rm(distPath, { recursive: true, force: true });

    // 只复制 dependencies 中声明的顶层包，不处理传递依赖。
    // 若未来新增的运行时依赖自身还有依赖，需额外收集传递依赖一并复制。
    // 或者后期改用更专业的工具（如 webpack）打包，避免手动维护依赖列表。
    const pkg = JSON.parse(await readFile(join(root, 'package.json'), 'utf-8'));
    const runtimeDeps = Object.keys(pkg.dependencies || {});
    await mkdir(join(distPath, 'node_modules'), { recursive: true });
    for (const dep of runtimeDeps) {
        await cp(join(root, 'node_modules', dep), join(distPath, 'node_modules', dep), {
            recursive: true,
        });
    }

    await cp(join(root, '_locales/'), join(distPath, '_locales/'), {
        recursive: true,
    });

    await cp(join(root, 'images/'), join(distPath, 'images/'), {
        recursive: true,
    });

    await cp(join(root, 'src/'), join(distPath, 'src/'), {
        recursive: true,
    });

    await copyFile(join(root, 'page-popup.html'), join(distPath, 'page-popup.html'));

    await copyFile(join(root, 'page-options.html'), join(distPath, 'page-options.html'));

    const manifest = JSON.parse(await readFile(join(root, 'manifest.json')));

    if (isFirefox) {
        manifest.background.scripts = manifest.background.scripts || [];
        if (!manifest.background.scripts.includes(manifest.background.service_worker)) {
            manifest.background.scripts.push(manifest.background.service_worker);
        }
        delete manifest.background.service_worker;

        manifest.browser_specific_settings = {
            gecko: {
                id: manifest.name + '@example.com',
                data_collection_permissions: {
                    required: ['none'],
                },
            },
        };
    }

    await writeFile(join(distPath, 'manifest.json'), JSON.stringify(manifest, null, 2));

    await rm(join(root, zipName), { force: true });

    // only for macOS
    if (isChrome) {
        exec(`zip -r ${zipName} ${distDir}`);
    }

    if (isFirefox) {
        exec(`cd ${distPath} && zip -r ../${zipName} *`);
    }
})();
