# Разработка скриптов на TypeScript 

- [Разработка скриптов на TypeScript](#разработка-скриптов-на-typescript)
	- [Первичная настройка](#первичная-настройка)
	- [Создание собственных скриптов](#создание-собственных-скриптов)
	- [Подсказки по TypeScript](#подсказки-по-typescript)
	- [Отладка скриптов](#отладка-скриптов)

Это небольшая инструкция, которая поможет скриптописателям повысить удобство и скорость
разработки скриптов для снегопата. 

Предлагаем использовать для этих целей редактор `Visual Studio Code` и язык `TypeScript`. Этот язык - развитие языка JavaScript,
к которому добавлена типизация переменных, классы и модули. Скрипт на языке TypeScript транслируется его компилятором в обычный JavaScript.

Благодаря возможности подключить к редактору файлы с описанием `SnegopatAPI` и типов 1С, при разработке скриптов для снегопата в редакторе отлично работает `intellisense`, что делает работу быстрой и комфортной.

## Первичная настройка

Начать его использование для разработки помогут несколько простых шагов. 

1. Скачиваем и устанавливаем Visual Studio Code: https://code.visualstudio.com/
2. Скачиваем и устанавливаем TypeScript: http://www.typescriptlang.org/  
    - Снегопат использует для своих скриптов TypeScript 2.6
      - его можно скачать отсюда: https://www.microsoft.com/en-us/download/details.aspx?id=55258
     	- в разделе Details есть нужный релиз. 
   	- Чтобы команда `tsc` запускалась отовсюду, можно добавить каталог `"c:\Program Files (x86)\Microsoft SDKs\TypeScript\2.6"` в переменную окружения `PATH`.
3. В папке снегопата, рядом с папками `addins` и `core` - создаем папку `custom`.
   - Снегопат в ней ищет дополнительные пользовательские аддины.
4. Создаем папку для разработки, например `develop`, можно тоже в папке снегопата, рядом с `addins` и `custom`.
5. В этой папке создаём подпапку `std`.
6. Копируем все `*.ts` файлы из `core\scripts\src` в папку `develop\std`.
7. В папке `develop` запускаем команду `tsc --init`
   - Она создаст файл проекта `tsconfig.json`
8. В этом файле 
   - исправляем путь к каталогу сборки, параметр `outDir`. В нем надо прописать путь к каталогу `custom`. 
      - Если папка `develop` рядом с ним, просто укажите: `"outDir": "../custom"`,
    - И добавьте рядом параметры 
      - `"emitBOM": true`
      - `"newLine": "LF"`
      - `"noImplicitUseStrict": true`
    
	Файл будет выглядеть примерно так
```json
		{
			"compilerOptions": {
				"module": "commonjs",
				"newLine": "LF",
				"noImplicitUseStrict": true,
				"target": "es3",
				"noImplicitAny": false,
				"outDir": "../custom",
				"rootDir": ".",
				"sourceMap": false,
				"emitBOM": true
			},
			"exclude": [
				"node_modules"
			]
		}
```

9. Запускаем Visual Studio Code: `code.exe "путь к папке develop"`
    
10. Жмем `Ctrl+Shift+P`, набираем `conf`, 
    - выбираем `Tasks: Configure Default Build Task`,
	- далее `tsc: build - tsconfig.json`
	
	Откроется окно с настройками сборки
```json
		{
			"version": "2.0.0",
			"tasks": [
				{
					"type": "typescript",
					"tsconfig": "tsconfig.json",
					"problemMatcher": [
						"$tsc"
					],
					"group": {
						"kind": "build",
						"isDefault": true
					},
					"label": "tsc: build - tsconfig.json"
				}
			]
		}
```

11. В окне снегопата в меню `Разработка` по очереди нажимаем `Сдампить SnegAPI в snegopat.d.ts` и `Сдампить типы 1С в v8.d.ts`. Файлы создадутся в каталоге снегопата.
	
	- Перемещаем их в каталог разработки (`develop`).

12. Это всё!

## Создание собственных скриптов

Теперь можно в этом каталоге создавать файлы с расширением `.ts`.

И по нажатию `Ctrl+Shift+B` они будут компилится в `js-файлы` в каталог `custom`.
Вместе с ними также скомпилятся еще и `std-скрипты` в папку `custom\std`, но они не помешают.

- В начале своих `ts-скриптов` пишем:

```ts
        //engine: JScript
        //uname: уникальное имя
        //addin: global
        ... другие теги ...
```

- Подключаем `SnegopatAPI` и `типы 1С`, файлы должны лежать в этом же каталоге:

```ts
        ...
        /// <reference path="./snegopat.d.ts" />
        /// <reference path="./v8.d.ts" />
        ...
```

- Подключаем глобальные контексты 1С

```ts
        ...
        global.connectGlobals(SelfScript);
        ...
```

- Подключаем нужные стандартные скрипты

```ts
        ...
        import * as stdlib from "./std/std";
        import * as stdcommands from "./std/commands";
        import * as hks from "./std/hotkeys";
        ...
```

и т.п., смотря какие скрипты нужны. 

В кавычках путь 

- обязательно должен начинаться с точки, 
- быть относительным каталога, где лежит скрипт, 
- расширение `ts` не указываем.

Также можно импортом подключать и другие свои скрипты, написанные на `TypeScript`.
В таких скриптах обязательно какие-нибудь методы должны быть `export`, смотрите примеры в стандартных скриптах.

## Подсказки по TypeScript

Переменные типизируются или сами при объявлении присваиванием, если тип выводится из выражения, либо можно через двоеточие указать явно. Самый общий тип - `any`.

Иногда TypeScript ругается на несовпадение типов - тогда приводите явно: `<ИмяТипа>`

Смотрите примеры, читайте интернет. Успехов!

## Отладка скриптов

Лучше всего установить Visual Studio Community Edition

- При установке отметить компоненты
  - `Поддержка языков JavaScript и TypeScript`
  - и `Диагностика JavaScript`. 
- Далее запустить `Visual Studio` и в меню `Tools->Options` в разделе `Debugging\Just-In-Time` поставить галочку на `Script`.

- В тексте скрипта в месте, где хочется подключить отладчик, написать `debugger` 
  
тогда при выполнении этой строки всплывёт отладчик. 

Дальше в нём уже можно выполнять пошагово, ставить точки останова,
просматривать переменные и т.д. и т.п. 

В окне `Solution Explorer` при этом будут видны все
загруженные скрипты, то есть можно открыть любой скрипт и поставить точку останова.

Также можно использовать скрипт `Немедленное выполнение кода`, в его окне есть кнопка `Вызвать отладчик`.
