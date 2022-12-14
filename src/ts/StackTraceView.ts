//engine: JScript
//uname: StackTraceView
//dname: Просмотр снимка стека
//author: Starykh Sergey (tormozit) tormozit@mail.ru
//help: inplace
//addin: global
//addin: stdlib
//addin: vbs

/*@
	Добавляет возможность переходить по текстовым ссылкам к строкам модулей. 
	Такие ссылки содержатся в описании ошибок 1С (например {ОбщаяФорма.ФормаУпр.Форма(6)}: Ошибка при вызове метода контекста ...).
    При вызове из формы журнала регистрации берет комментарий текущего события. 
	В остальных случаях при открытии берет текст из буфера обмена. По умолчанию открытие снимка стека назначается на `ALT+SHIFT+G`.
	Не поддерживает расширения конфигураций (ограничение API). 
	Скрипт после открытия нужного модуля сможет установить курсор на нужную строку только при включенном флажке "Работать при наборе текста" в настройках снегопата (ограничение API).
	Более универсально эту же задачу решает менеджер буфера обмена ClipAngel http://devtool1c.ucoz.ru/forum/3-609-1.
@*/

/// <reference path="./snegopat.d.ts" />
/// <reference path="./v8.d.ts" />
import * as stdlib from "./std/std";

global.connectGlobals(SelfScript);

var Manager;

////////////////////////////////////////////////////////////////////////////////////////
////{ Макросы
////

SelfScript.self['macrosОткрыть снимок стека'] = function () {

	var newText;
	var focusedView = windows.getFocusedView();
	if (focusedView.title.match(/Журнал\sрегистрации/))
	{
		var Table = focusedView.getInternalForm().activeControl;
		var columnDetailsID = 6;
		if (Table.name == "EventList")
		{
			newText = Table.extInterface["currentRow"].getCellAppearance(columnDetailsID).text;
		}
	}	
	if (Manager == null)
		Manager = new StackTrace;
	else if (true
		&& Manager.form.СнимокУровни.Количество() > 0 
		&& newText!= Manager.form.СнимокТекст 
		&& !Manager.form.ЭлементыФормы.Найти("КПТекст").Кнопки.Найти("ПриемДанных").Пометка
	)
		Manager = new StackTrace;
	Manager.form.СнимокТекст = newText;
	Manager.form.Открыть();
}

////} Макросы

/* Возвращает название макроса по умолчанию - вызывается, когда пользователь 
дважды щелкает мышью по названию скрипта в окне Снегопата. */
function getDefaultMacros() {
    return 'Открыть снимок стека';
}

type EditorsRow = {Уровень: number, Ссылка: string} & ValueTableRow;
type EditorsTable = {Get(p:number): EditorsRow, Add(): EditorsRow} & ValueTable;
type StackTraceForm = {СнимокУровни: EditorsTable, СнимокТекст: string} & Form;

//{ Горячие клавиши по умолчанию.
function getPredefinedHotkeys(predef) {
    predef.setVersion(3);
    predef.add('Открыть снимок стека', "Alt + Shift + G");
}

function findMdObjByFullName(RelativeName: string, parentObj:IV8MDObject = null) :IV8MDObject
{
	if (parentObj == null)
		parentObj = metadata.current.rootObject;
	var mdc = parentObj.mdclass
	var classNameParts = RelativeName.split(".")
	var targetClassName = classNameParts[0]
	var targetObjName = classNameParts[1]
	var RelativeName = ""
	if (classNameParts.length >= 4)
		RelativeName = classNameParts.slice(2).join(".")
    for(var i = 0, im = mdc.childsClassesCount; i < im; i++)
    {
		var childClassName = mdc.childClassAt(i).name(1, false)
		if (childClassName.toUpperCase() != targetClassName.toUpperCase())
			continue
        for(var chldidx = 0, c = parentObj.childObjectsCount(i); chldidx < c; chldidx++){
			var childObject = parentObj.childObject(i, chldidx)
			if (childObject.name.toUpperCase() != targetObjName.toUpperCase())
				continue
			if (RelativeName == "")
				return childObject
			else
				return findMdObjByFullName(RelativeName, childObject)
        }
	}
	return null;
}

class StackTrace {
	form: StackTraceForm;
	regExp: RegExp;
	timerId: number;
    constructor() {
		this.timerId = 0;
		this.form = loadScriptFormEpf(SelfScript.fullPath.replace(/js$/i, "epf"), "Форма", this);
	}
	private CheckText(text:string)
	{
		var regExp = this.RegExp();
		return regExp.test(text)
	}

	private ProcessText(text: string) {
		this.form.СнимокУровни.Очистить();
		var Level = 0;
		var match;
		var regExp = this.RegExp();
		var НовыйЗаголовок = "Снимок стека";
		while ((match = regExp.exec(text)) !== null && Level < 1000) {
			if (Level == 0)
				НовыйЗаголовок = НовыйЗаголовок + ". " + match[0]
			var row = this.form.СнимокУровни.Add();
			row.Уровень = Level;
			row.Ссылка = match[0];
			Level++;
		}
		this.form.Заголовок = НовыйЗаголовок;
	}
	СнимокТекстПриИзменении(Элемент = null){
		this.ProcessText(this.form.СнимокТекст)
	}

	СнимокУровниВыбор(Элемент, ВыбраннаяСтрока, Колонка, СтандартнаяОбработка){
		var text = ВыбраннаяСтрока.val.Ссылка;
		var regExp = this.RegExp();
		var match = regExp.exec(text);
		// debugger
		var mdObj = findMdObjByFullName(match[3]);
		if (mdObj == null) {
			Message("Объект метаданных не найден");
			return
		}
		var NameParts = match[3].split(".");
		var ИмяМодуля = NameParts[NameParts.length - 1];
		var editorWindow = mdObj.openModule(ИмяМодуля);
		if (editorWindow == null)
		{
			//https://snegopat.ru/forum/viewtopic.php?f=8&t=920
			Message("Позиционирование на строке пока работает только с включенной настройкой снегопата \"Работать при наборе текста\"");
			return;
		}	
		editorWindow.setCaretPos(parseInt(match[4]), 1);
	}
	КПТекстНовоеОкно(Кнопка)
	{
		var newObj = new StackTrace;
		newObj.form.Открыть();
	}
	ПриОткрытии()
	{
		if (this.form.СнимокТекст != "")
			this.СнимокТекстПриИзменении();
		else
			this.timerId = createTimer(1*300, this, 'onTimerPaste');
	}
	ПриПовторномОткрытии()
	{
		this.ПриОткрытии();
	}
	onTimerPaste(timerId) {
		this.stopWatch(timerId);
		if (this.form.ВводДоступен())
			this.КПТекстВставить();
	}
	СнимокТекстАвтоПодборТекста(Элемент, Текст, ТекстАвтоПодбора, СтандартнаяОбработка)
	{
		this.ProcessText(Текст.val);
	}
	КПТекстВставить(Кнопка = null)
	{
		this.form.ТекущийЭлемент = this.form.ЭлементыФормы.Найти("СнимокТекст")
		var wsh = new ActiveXObject("WScript.Shell");
		wsh.SendKeys("^{a}");
		wsh.SendKeys("^{ф}");
		wsh.SendKeys("^{v}");
		wsh.SendKeys("^{м}");
		this.timerId = createTimer(1*100, this, 'onTimerUpdate');
	}
	onTimerUpdate(timerId) {
		
		this.stopWatch(timerId);
		this.form.ТекущийЭлемент = this.form.ЭлементыФормы.Найти("СнимокУровни");
		this.form.ТекущийЭлемент = this.form.ЭлементыФормы.Найти("СнимокТекст");
	}
    stopWatch(timerId) {
        killTimer(timerId);
	}
	КПТекстПриемДанных(Кнопка)
	{
		Кнопка.val.Пометка = !Кнопка.val.Пометка;
	}
	public RegExp() {
		return /(\{([a-zа-яё0-9_]+ )?((?:[a-zа-яё0-9_]+\.)*(?:Форма|Form|Модуль[a-zа-яё0-9_]*|[a-zа-яё0-9_]*Module))\((\d+)(?:,(\d+))?\)\})/ig;
	}
}
