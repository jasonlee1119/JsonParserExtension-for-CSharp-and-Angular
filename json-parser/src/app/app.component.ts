import { Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})

export class AppComponent implements OnInit{
  jsonString: string = '';
  accessorString = '{ get; set; }';
  modifierString = 'public';
  dateTimeOffsetPattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?\+\d{2}:\d{2}$/;
  dateTimePattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?$/;
  utcDateTiimePattern =/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?[Zz]$/;
  showCopyMessage: string = 'Text has been copied to clipboard!';
  isClickCopyCS: boolean = false;
  isClickCopyTS: boolean = false;

  inputForm = this.fb.group({
    jsonStringInputCSharp: this.fb.control<string>('', {validators: [Validators.required], nonNullable: true}),
    jsonStringInputTypeScript: this.fb.control<string>('', {validators: [Validators.required], nonNullable: true}),
    cSharpClassString: this.fb.control<string>('',{}),
    typeScriptInterfaceString: this.fb.control<string>('',{})
  });

  constructor(private fb: FormBuilder){
  }

  ngOnInit(): void {
    this.inputForm.controls.jsonStringInputCSharp.valueChanges.subscribe((value) => {
      if (value !== this.inputForm.controls.jsonStringInputTypeScript.value){
        this.inputForm.controls.jsonStringInputTypeScript.setValue(value);
      }

      const inputJSON = value;
      const formattedJSON = formatJSON(inputJSON);

      if (!formattedJSON) {
        this.inputForm.controls.cSharpClassString.setValue('Invalid Json String');
        this.inputForm.controls.typeScriptInterfaceString.setValue('Invalid Json String');
        return;
      }

      const jsonObject = JSON.parse(formattedJSON);
      const result = this.analyzeJsonObject(jsonObject);

      this.inputForm.controls.cSharpClassString.setValue(this.convertToCSharpClass(result));
      this.inputForm.controls.typeScriptInterfaceString.setValue(this.convertToTypeScriptInterface(result));
    });

    this.inputForm.controls.jsonStringInputTypeScript.valueChanges.subscribe((value) => {
      if (value === this.inputForm.controls.jsonStringInputCSharp.value){
        return;
      }
      this.inputForm.controls.jsonStringInputCSharp.setValue(value);
    })
  }

  resetForm():void{
    this.inputForm.reset();
  }

  analyzeJsonObject(jsonObject: any): ObjectInfo[] {
    return Object.keys(jsonObject).map((x) => {
      return {
        name: x,
        value: jsonObject[x],
        type: Array.isArray(jsonObject[x]) ? 'array' : typeof jsonObject[x]
      } as ObjectInfo
    })
  }

  convertToCSharpClass(infos: ObjectInfo[]): string {
    let resultString = 'public class ClassName\n{\n';

    resultString += infos.map((x) => {
      return `    ${this.modifierString} ${this.convertCSharpTypeString(x.type, x.value)} ${camelToPascal(x.name)} ${this.accessorString}`;
    }).join('\n');
    resultString += '\n}';

    return resultString ;
  }

  convertToTypeScriptInterface(infos: ObjectInfo[]): string{
    let resultString = 'export interface interfaceName {\n';

    resultString += infos.map((x) => {
      return `  ${x.name}: ${this.convertTypeScriptTypeString(x.type, x.value)};`;
    }).join('\n');
    resultString += '\n}';

    return resultString ;
  }

  convertCSharpTypeString(type: string, value: any ): string{
    switch (type){
      case 'number':
        return (value as number) % 1 === 0 ? 'int' : 'float';
      case 'boolean':
        return 'bool';
      case 'string':
        return this.testIsStringOrDate(value as string);
      case 'array':
        return `List<${this.convertCSharpTypeString(typeof value[0], value[0])}>`;
      case 'null':
        return 'string';
      default:
        return type;
    }
  }

  convertTypeScriptTypeString(type: string, value: any ): string{
    switch (type){
      case 'string':
        return this.testIsStringOrDate(value as string, Language.TypeScript);
      case 'array':
        return `${this.convertTypeScriptTypeString(typeof value[0], value[0])}[]`;
      case 'null':
        return 'any';
      default:
        return type;
    }
  }

  testIsStringOrDate(input: string, language: Language = Language.CSharp): string{
    const isDateTime = this.dateTimePattern.test(input);
    const isDateTimeOffset = this.dateTimeOffsetPattern.test(input);
    const isUTCDateTime = this.utcDateTiimePattern.test(input);

    if (language !== Language.CSharp){
      return isDateTime || isDateTimeOffset || isUTCDateTime ? 'Date' : 'string'
    }

    return isDateTimeOffset || isUTCDateTime
      ? 'DateTimeOffset' : isDateTime
      ? 'DateTime' : 'string';
  }

  copyText(language: number): void{
    const text = language === Language.CSharp
      ? this.inputForm.controls.cSharpClassString.value ?? ''
      : this.inputForm.controls.typeScriptInterfaceString.value ?? ''
    navigator.clipboard.writeText(text).then(() => {
      switch(language){
        case Language.CSharp:
          this.isClickCopyCS = true;
          setTimeout(() => {this.isClickCopyCS = false;}, 2500);
          break;
        case Language.TypeScript:
          this.isClickCopyTS = true;
          setTimeout(() => {this.isClickCopyTS = false;}, 2500);
          break;
      }
    });
  }

  showToolTip(language: number){

  }
}

interface ObjectInfo{
  name: string;
  value: any;
  type: string;
}

enum Language{
  CSharp,
  TypeScript
}

function isValidJSON(jsonString: string): boolean {
  try {
    JSON.parse(jsonString);
    return true;
  } catch (error) {
    return false;
  }
}

function formatJSON(jsonString: string): string | null {
  if (isValidJSON(jsonString)) {
    try {
      const parsedJSON = JSON.parse(jsonString);
      const formattedJSON = JSON.stringify(parsedJSON, null, 2);
      return formattedJSON;
    } catch (error) {
      return null;
    }
  } else {
    return null;
  }
}

function camelToPascal(input: string): string {
  const words = input.split(/(?=[A-Z])/);
  const pascalWords = words.map(word => word.charAt(0).toUpperCase() + word.slice(1));
  return pascalWords.join('');
}
