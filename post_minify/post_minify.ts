import { file_exists_, file_exists__waitfor } from 'ctx-core/fs'
import { run } from 'ctx-core/run'
import { readdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { minify } from 'terser'
export async function post_minify(dir:string) {
	const promise_a1:Promise<void>[] = []
	for (const path of await readdir(dir!)) {
		if (path.endsWith('.js') || path.endsWith('.mjs')) {
			const source_path = join(dir, path)
			const has_map = await file_exists_(source_path + '.map')
			const minify_o = await minify(await Bun.file(source_path).text(), {
				module: true,
				sourceMap: (
					has_map
						? {
							content: await readFile(source_path + '.map').then(buf=>'' + buf)
						}
						: undefined
				) as never
			})
			const {
				code,
				map
			} = minify_o
			promise_a1.push(
				run(async ()=>{
					await writeFile(source_path, code!)
					await file_exists__waitfor(
						()=>
							readFile(source_path)
								.then(buf=>'' + buf === code),
						5_000)
				}),
				run(async ()=>{
					if (!has_map) return
					await writeFile(source_path + '.map', '' + map)
					await file_exists__waitfor(
						()=>
							readFile(source_path + '.map')
								.then(buf=>'' + buf === map),
						5_000)
				}))
		}
	}
}
