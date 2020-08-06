function getAuthType() {
  var cc = DataStudioApp.createCommunityConnector();
  return cc.newAuthTypeResponse()
    .setAuthType(cc.AuthType.NONE)
    .build();
}
function getConfig(request) {
  var cc = DataStudioApp.createCommunityConnector();
  var config = cc.getConfig();
  
  config
  .newTextInput()
  .setId('app_id')
  .setName('APP ID')
  .setHelpText('APP ID')
  .setAllowOverride(true)
  
  config
  .newTextInput()
  .setId('api_key')
  .setName('API KEY')
  .setHelpText('API KEY')
  .setAllowOverride(true)
  
  config.setDateRangeRequired(true);
  return config.build();
}

function getFields() {
  var cc = DataStudioApp.createCommunityConnector();
  
  var fields = cc.getFields();
  var types = cc.FieldType;
  var aggregations = cc.AggregationType;
  fields
    .newDimension()
    .setId('app_name')
    .setName('App name')
    .setType(types.TEXT);
  fields
    .newDimension()
    .setId('primary_result')
    .setName('Primary Result')
    .setType(types.TEXT);

  fields
    .newDimension()
    .setId('timestamp')
    .setName('Timestamp')
    .setType(types.YEAR_MONTH_DAY);
  fields
    .newDimension()
    .setId('full_timestamp')
    .setName('Full Timestamp')
    .setType(types.YEAR_MONTH_DAY_SECOND);
  
  
  fields
    .newMetric()
    .setId('duration')
    .setName('Duration')
    .setType(types.NUMBER);
  return fields;
}


function getSchema(request) {
  return {schema: getFields().build()};
}


function getData(request) {
  var start_date = request.dateRange.startDate;
  var end_date = request.dateRange.endDate;
  var app_id = request.configParams.app_id;
  var key = request.configParams.api_key;
  var logrequest = "requests | project cloud_RoleName, timestamp, success, duration| where timestamp >= todatetime('"+start_date+"') and timestamp <= todatetime('"+end_date+"')| order by timestamp desc";


  
  
  logrequest = encodeURIComponent(logrequest)
  var url = "https://api.applicationinsights.io/v1/apps/"+app_id+"/query?query="+logrequest+"&api_key="+key;

 

  var requestedFieldIds = request.fields.map(function(field) {
    return field.name;
  });
  var requestedFields = getFields().forIds(requestedFieldIds);  
  
  
  

  var response = JSON.parse(UrlFetchApp.fetch(url));
    
  
 
  var columns = response.tables[0].columns;
  var rows = response.tables[0].rows;



  var data = [];
  rows.forEach(function(item) {
    var values = [];
    
    requestedFields.asArray().forEach(function(field) {
      
      switch (field.getId()) {
        case 'app_name':
          values.push(item[0]);
          break;
        case 'timestamp':
          var cur_date = item[1].replace(/\T.*|\-/g, '')
          values.push(cur_date);
          break;
        case 'full_timestamp':
          var cur_date = item[1].replace(/\T|\-|\:|\..*/g, '')
          values.push(cur_date);
          break;
        case 'primary_result':
          values.push(item[2]);
          break;
        case 'duration':
          values.push(item[3]);
          break;

        default:
          break;
      }
    });
    data.push({
      values: values
    });
  });
  
  
  var final_result = {
    schema: requestedFields.build(),
    rows: data
  };
    
    
  
  
    
  
  
  return final_result
}


function isAdminUser() {
  return true;
}

function throwConnectorError(text) {
  DataStudioApp.createCommunityConnector()
    .newUserError()
    .setDebugText(text)
    .setText(text)
    .throwException();
}