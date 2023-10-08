import { Component, OnInit } from '@angular/core';
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

  inputForm = this.fb.group({
    jsonStringInput: this.fb.control<string>('', {validators: [Validators.required], nonNullable: true})
  });

  constructor(private fb: FormBuilder){
  }

  ngOnInit(): void {
    this.inputForm.controls.jsonStringInput.valueChanges.subscribe((value) => {
      const inputJSON = value;
      const formattedJSON = formatJSON(inputJSON);

      if (!formattedJSON) {
        return;
      }

      const jsonObject = JSON.parse(formattedJSON);
      const result = this.analyzeJsonObject(jsonObject);
      console.log(this.convertToCSharpClass(result));
    });
  }



  analyzeJsonObject(jsonObject: any): ObjectInfo[] {
    return Object.keys(jsonObject).map((x) => {
      return {
        name: x,
        value: jsonObject[x],
        type: typeof jsonObject[x]
      } as ObjectInfo
    })
  }

  convertToCSharpClass(infos: ObjectInfo[]): string {
    let resultString = 'public class ClassName {\n';

    resultString += infos.map((x) => {
      return '\t' + `
      ${this.modifierString} ${this.convertTypeString(x.type, x.value)} ${x.name} ${this.accessorString}`;
    }).join('\n');
    resultString += '\n}';

    console.log(resultString);

    return resultString ;
  }

  convertTypeString(type: string, value: any ){
    switch (type){
      case 'number':
        return (value as number) % 1 === 0 ? 'int' : 'float';
      case 'boolean':
        return 'bool';
      case 'Date':
        return 'DateTimeOffset';
      default:
        return type;
    }
  }
}

interface ObjectInfo{
  name: string;
  value: any;
  type: string;
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
      console.error('Error formatting JSON:', error);
      return null;
    }
  } else {
    return null;
  }
}
