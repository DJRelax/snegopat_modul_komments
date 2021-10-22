﻿//engine: JScript
//uname: author
//dname: Авторский комментарий
//author: Александр Кунташов <kuntashov@gmail.com>, http://compaud.ru/blog
//descr: Быстрая вставка авторских комментариев об изменениях кода
//help: inplace
//www: https://snegopat.ru/forum/viewtopic.php?t=111
//addin: global
//addin: stdlib

stdlib.require("TextWindow.js", SelfScript);
global.connectGlobals(SelfScript);

/*@
Cкрипт "Авторский комментарий" (author.js) для проекта "Снегопат"


Описание: Реализует возможности разметки кода по признакам модифицированности с указанием реквизитов автора.
@*/

////////////////////////////////////////////////////////////////////////////////////////
////{ Макросы
////

SelfScript.self['macrosМаркер "Добавлено"'] = function() {
    addMarker(MarkerTypes.ADDED);
}

SelfScript.self['macrosМаркер "Изменено"'] = function() {
    addMarker(MarkerTypes.CHANGED);
}

SelfScript.self['macrosМаркер "Удалено"'] = function() {
    addMarker(MarkerTypes.REMOVED);
}

SelfScript.self['macrosНастройка'] = function() {
    // form - неявно определяемая глобальная переменная.
    form = loadFormForScript(SelfScript);
    form.DoModal();
    form = null;
}

/* Возвращает название макроса по умолчанию - вызывается, когда пользователь 
дважды щелкает мышью по названию скрипта в окне Снегопата. */
function getDefaultMacros() {
    return 'Настройка';
}

////} Макросы

var MarkerTypes = {
    ADDED: "МаркерДобавлено",
    REMOVED: "МаркерУдалено",
    CHANGED:"МаркерИзменено"
};

var MarkerFormatStringParameters = {};
var pflAuthorJs = 'Авторский комментарий/Настройки';

function addMarker(markerType) {

    var w = GetTextWindow();
    if (!w) return;
            
    var sel = w.GetSelection();
    if (sel.beginRow == sel.endRow)
    {    
        // Однострочник.        
        var line = w.GetLine(sel.beginRow);
        var code = markLine(markerType, line);        
        w.ReplaceLine(sel.beginRow, code);
    }
    else 
    {
        // Блок кода.
        var endRow = sel.endCol > 1 ? sel.endRow : sel.endRow - 1;
        var block = w.Range(sel.beginRow, 1, endRow).GetText();        
        var code = markBlock(markerType, block);        
        w.Range(sel.beginRow, 1, endRow).SetText(code);
    }    
}

//#Удаление // {Тишкин С.А. Более не актууально. Обрабатывается строка шаблона функцией getStringWithParams(StringWithParams)
//function getSignature() {
//    var fmt = Settings['ФорматПодписи'];
//    //Павлюков С.Ю. - изменена строка: иначе дата должна была быть только последней
//    //var ptn = /%(.+?)(?:#(.+)){0,1}%/ig;
//    var ptn = /%(.+?)(?:#(.+^%)){0,1}%/ig;
//    return fmt.replace(ptn, function (match, p1, p2, offset, s) {
//        // p1 - имя управляющей конструкции.
//        // p2 - параметр управляющей конструкции (для ДатаВремя).
//		//Павлюков С.Ю. - добавлено условие с разбором даты и формата
//		if (p1.match("(.+)#(.+)")){
//			p1 = RegExp.$1;
//			p2 = RegExp.$2;
//		}
//		if (!MarkerFormatStringParameters[p1]) {
//			Message('В настройках подписи для авторского комментария встретилась неизвестная конструкция "' + p1 + '"');
//			return p1;
//		}
//        return MarkerFormatStringParameters[p1].call(null, p2);
//    });
//}
//#КонецУдаления // }Тишкин С.А.

//#Вставка // {Тишкин С.А.
function getStringWithParams(StringWithParams) {
    var ptn = /%(.+?)(?:#(.+^%)){0,1}%/ig;
    return StringWithParams.replace(ptn, function (match, p1, p2, offset, s) {
        // p1 - имя управляющей конструкции.
        // p2 - параметр управляющей конструкции (для ДатаВремя).
		//Павлюков С.Ю. - добавлено условие с разбором даты и формата
		if (p1.match("(.+)#(.+)")){
			p1 = RegExp.$1;
			p2 = RegExp.$2;
		}
		if (!MarkerFormatStringParameters[p1]) {
			Message('В настройках подписи для авторского комментария встретилась неизвестная конструкция "' + p1 + '"');
			return p1;
		}
        return MarkerFormatStringParameters[p1].call(null, p2);
    });
}
//#КонецВставки // }Тишкин С.А.

function getStartComment(markerType) {
    //#Удаление // #Замена {Тишкин С.А.
    //return "//" + Settings[markerType] + " " + getSignature();
    //#КонецУдаления
    //#Вставка
    // Весь шаблон подписи начала блока (и конца) теперь можно размещать в поле соответсвующей настройки
    //---- Заменено на: ----
    return "//" +  getStringWithParams(Settings[markerType]);
    //#КонецВставки // #КонецЗамены }Тишкин С.А.
}

//#Удаление // #Замена {Тишкин С.А.
//function getEndComment() {
//
//    var endComment = "//" + Settings["ЗакрывающийМаркерБлока"];
//    
//    if (!Settings["НеДобавлятьСигнатуруПослеЗакрывающегоМаркера"])
//        endComment += " " + getSignature();
//
//    return endComment;
//}
//#КонецУдаления
//#Вставка
// Получение текстов пропущено через обработку для получения значений полей
// Учтена обработка отдельных полей закрывающих разные типы маркеров (Добавление(Вставка) / Удаление / Замена (Удаление+Вставка))
//---- Заменено на: ----
function getEndComment(markerType) {

    var endComment = "//" + (!Settings[markerType+"КонецБлока"] ? getStringWithParams(Settings["ЗакрывающийМаркерБлока"]) : getStringWithParams(Settings[markerType+"КонецБлока"]));
    
    if (!Settings["НеДобавлятьСигнатуруПослеЗакрывающегоМаркера"])
        endComment += " " + getStringWithParams(Settings['ФорматПодписи']);

    return endComment;
}
//#КонецВставки // #КонецЗамены }Тишкин С.А.

function markLine(markerType, line) {

    // Удалим концевые пробелы в строке.
    var code = line.replace(/(.+?)\s*$/, "$1");
    
    switch (markerType) 
    {
    case MarkerTypes.ADDED:
        // Добавляем в хвост подпись.
        code = code + getStartComment(markerType);
        break;
        
    case MarkerTypes.REMOVED:
        // Закомментируем строку и в хвост добавим подпись.
        code = commentLine(code) + getStartComment(markerType);
        break;
        
    case MarkerTypes.CHANGED:
        // Маркер "Изменено" для однострочника такой же как и для блока.
        var indent = StringUtils.getIndent(code);
        code = indent + getStartComment(markerType) + "\n";
        //#Удаление // #Замена {Тишкин С.А.
        //code += prepareChangedBlock(line, indent) + "\n";
        //code += indent + getEndComment() + "\n";            
        //#КонецУдаления
        //#Вставка
        // Замена функций на обработку строки шаблона
        //---- Заменено на: ----
        code += getStringWithParams(prepareChangedBlock(line, indent)) + "\n";
        code += indent + getEndComment(markerType) + "\n";            
        //#КонецВставки // #КонецЗамены }Тишкин С.А.
        break;
    }
        
    return code;
}

function markBlock(markerType, block) {
    
    var indent = StringUtils.getIndent(block);
    var code = indent + getStartComment(markerType) + "\n";
    
    switch (markerType) 
    {
    case MarkerTypes.ADDED:
        code += block + "\n";
        break;
        
    case MarkerTypes.REMOVED:
        code += commentBlock(block, indent) + "\n";
        break;
        
    case MarkerTypes.CHANGED:
        //#Удаление // #Замена {Тишкин С.А.
        //code += prepareChangedBlock(block, indent) + "\n";
        //#КонецУдаления
        //#Вставка
        // Замена функций на обработку строки шаблона
        //---- Заменено на: ----
        code += getStringWithParams(prepareChangedBlock(block, indent)) + "\n";
        //#КонецВставки // #КонецЗамены }Тишкин С.А.
        break;
    }
    
    //Комментарий окончания изменений.
    code += indent + getEndComment(markerType);
   
    return code;
}

function prepareChangedBlock(block, indent) {
    
    var code = '';    
    if (!Settings["НеОставлятьКопиюКодаПриЗамене"]) 
    {
        code += commentBlock(block, indent) + "\n";
        
        if (Settings["РазделительКодаПриЗамене"])
        //#Удаление // #Замена {Тишкин С.А.
        //    code += indent + "//" + Settings["РазделительКодаПриЗамене"] + "\n";
        //#КонецУдаления
        //#Вставка
        // Разделитель кода при замене теперь тоже шаблон и обрабатывается соответственно
        //---- Заменено на: ----
        {
            var replacingCodeSeparator = Settings["РазделительКодаПриЗамене"];
            
            var lines = new Array()
            //lines = replacingCodeSeparator.split("\r\n|\r|\n");
            lines = replacingCodeSeparator.split("\n");
            rowsNumber = lines.length;
            if (rowsNumber > 1)
            {
                var replacingCodeSeparator_="";
                for(index = 0; index < rowsNumber; ++index)
                {
                    replacingCodeSeparator_ = replacingCodeSeparator_ + indent + "//" + lines[index] + "\n";
                }
                replacingCodeSeparator = replacingCodeSeparator_;
            }
            else
            {
                replacingCodeSeparator = indent + "//" + replacingCodeSeparator + "\n";
            }
            
            code += replacingCodeSeparator;
        }
        //#КонецВставки // #КонецЗамены }Тишкин С.А.
    }
    
    code += block;
    
    return code;
}

function commentLine(line, indent) {
    // Комментарий поставим после отступа.
    if (!indent) 
        indent = '\\s+';
    return line.replace(new RegExp('^(' + indent + ')(.*)'), "$1//$2");
}

function commentBlock(block, indent) {
    var lines = StringUtils.toLines(block);
    for(var i=0; i<lines.length; i++)
        lines[i] = commentLine(lines[i], indent);
    return StringUtils.fromLines(lines);
}

function getSettings() {

    var s = v8New("Структура");
    
    /* Настройки для подписи. Общий формат подписи:
       
       //<Маркер> <Подпись>
       ... содержимое блока ...
       //<ЗакрывающийМаркерБлока> <Подпись>
       
    Для однострочника не используется завершающая часть комментария, 
    т.к. однострочник добавляется в конец строки. */
    
    // Настройки по умолчанию.
    s.Вставить("ФорматПодписи", "%ИмяПользователяОС% %ДатаВремя#ДФ=dd.MM.yyyy%");
    s.Вставить("МаркерДобавлено", "Добавлено:");
    s.Вставить("МаркерУдалено", "Удалено:");
    s.Вставить("МаркерИзменено", "Изменено:");
    s.Вставить("ЗакрывающийМаркерБлока", "/");
    s.Вставить("РазделительКодаПриЗамене", "---- Заменено на: ----");
    // Дополнительные настройки:
    s.Вставить("НеОставлятьКопиюКодаПриЗамене", false);
    s.Вставить("НеДобавлятьСигнатуруПослеЗакрывающегоМаркера", false);
    //#Вставка // {Тишкин С.А.
    // В обработку (Настройки) добавлены поля для закрывающих маркеров блоков
    // Если плагин уже используется, то в настройках этих полей нет и они затираются считыванием настроек
    // Нужно их заполнить ниже считывания настроек из хранилища
    s.Вставить("МаркерДобавленоКонецБлока", "/");
    s.Вставить("МаркерУдаленоКонецБлока", "/");
    s.Вставить("МаркерИзмененоКонецБлока", "/");
    //#КонецВставки // }Тишкин С.А.
    
    profileRoot.createValue(pflAuthorJs, s, pflSnegopat)    
    s = profileRoot.getValue(pflAuthorJs);
    //#Вставка // {Тишкин С.А.
    // В обработку (Настройки) добавлены поля для закрывающих маркеров блоков
    // Если плагин уже используется, то в настройках этих полей нет и они затираются считыванием настроек
    // Нужно их заполнить ниже считывания настроек из хранилища
    if(!s.Свойство("МаркерДобавленоКонецБлока")) {
        s.Вставить("МаркерДобавленоКонецБлока", "/");
        s.Вставить("МаркерУдаленоКонецБлока", "/");
        s.Вставить("МаркерИзмененоКонецБлока", "/");}
    //#КонецВставки // }Тишкин С.А.
    
    return s;
}

function parseTpl() {
    var a = [];    
    for (var i=0; i<arguments.length;  i++)
        a.push(arguments[i]);        
    return snegopat.parseTemplateString('<?"", ' + a.join(',') + '>');
}

function addFormatStringParam(name, code) {
    var paramGetter = function (p) {
        return eval(code);
    }
    MarkerFormatStringParameters[name] = paramGetter;
}

function addToSignatureFormat(form, paramName) {
    if (!form.ФорматПодписи.match(/^\s+$/))
        form.ФорматПодписи += ' ';
    form.ФорматПодписи += '%' + paramName + '%';
}

//{ Обработчики элементов управления формы
function ПриОткрытии () {
    ЗаполнитьЗначенияСвойств(form, Settings);
}

function КнопкаОкНажатие (Элемент) {
    ЗаполнитьЗначенияСвойств(Settings, form);
    profileRoot.setValue(pflAuthorJs, Settings);
    form.Close();
}

function КнопкаОтменаНажатие (Элемент) {
    form.Close();
}

function НадписьИмяПользователяНажатие (Элемент) {
    addToSignatureFormat(form, Элемент.val.Заголовок);
}

function НадписьПолноеИмяПользователяНажатие (Элемент) {
    addToSignatureFormat(form, Элемент.val.Заголовок);
}

function НадписьИмяПользователяХранилищаКонфигурацииНажатие (Элемент) {
    addToSignatureFormat(form, Элемент.val.Заголовок);
}

function НадписьИмяПользователяОСНажатие (Элемент) {
    addToSignatureFormat(form, Элемент.val.Заголовок);
}

function НадписьДатаВремяНажатие (Элемент) {
    var КонструкторФорматнойСтроки = v8New("КонструкторФорматнойСтроки");
    КонструкторФорматнойСтроки.ДоступныеТипы = v8New("ОписаниеТипов", "Дата");
    if (КонструкторФорматнойСтроки.ОткрытьМодально())
        addToSignatureFormat(form, "ДатаВремя#" + КонструкторФорматнойСтроки.Текст);
}


//[+] Brad 19.12.2013
function НадписьТекущаяЗадачаНажатие (Элемент) {
    addToSignatureFormat(form, Элемент.val.Заголовок);
}

function getCurentTask() {
	
	var pflCurTask = 'Задачи/ТекущаяЗадача';
	
	var s = v8New("Структура","Задача,Описание","","");	
	profileRoot.createValue(pflCurTask, s, pflSnegopat)    
    s = profileRoot.getValue(pflCurTask);
	
	return s.Задача;
}
// Brad 19.12.2013


//} Обработчики элементов управления формы

//{ Горячие клавиши по умолчанию.
function getPredefinedHotkeys(predef) {
    predef.setVersion(1);
    predef.add('Маркер "Добавлено"', "Alt + A");
    predef.add('Маркер "Изменено"', "Alt + C");
    predef.add('Маркер "Удалено"', "Alt + D");
}
//} Горячие клавиши по умолчанию.

//{ Параметры подстановки, используемые в форматной строке подписи.
addFormatStringParam("ИмяПользователя", "parseTpl(name)")
addFormatStringParam("ПолноеИмяПользователя", "parseTpl(name)")
addFormatStringParam("ИмяПользователяХранилищаКонфигурации", "parseTpl(name)")
addFormatStringParam("ДатаВремя", "parseTpl(name, '\"' + p + '\"')")
addFormatStringParam('ИмяПользователяОС', "(new ActiveXObject('WScript.Shell')).ExpandEnvironmentStrings('%USERNAME%')");
//[+] Brad 19.12.2013
addFormatStringParam("ТекущаяЗадача", "getCurentTask()")
// Brad 19.12.2013
//} Параметры подстановки, используемые в форматной строке подписи.

var Settings = getSettings();


