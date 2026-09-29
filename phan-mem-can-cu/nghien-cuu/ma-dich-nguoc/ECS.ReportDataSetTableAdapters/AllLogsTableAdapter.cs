using System.CodeDom.Compiler;
using System.ComponentModel;
using System.ComponentModel.Design;
using System.Data;
using System.Data.Common;
using System.Data.OleDb;
using System.Diagnostics;
using ECS.Properties;

namespace ECS.ReportDataSetTableAdapters;

[DataObject(true)]
[Designer("Microsoft.VSDesigner.DataSource.Design.TableAdapterDesigner, Microsoft.VSDesigner, Version=10.0.0.0, Culture=neutral, PublicKeyToken=b03f5f7f11d50a3a")]
[HelpKeyword("vs.data.TableAdapter")]
[DesignerCategory("code")]
[ToolboxItem(true)]
public class AllLogsTableAdapter : Component
{
	private OleDbDataAdapter _adapter;

	private OleDbConnection _connection;

	private OleDbCommand[] _commandCollection;

	private bool _clearBeforeFill;

	[DebuggerNonUserCode]
	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	private OleDbDataAdapter Adapter
	{
		get
		{
			if (_adapter == null)
			{
				InitAdapter();
			}
			return _adapter;
		}
	}

	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	[DebuggerNonUserCode]
	internal OleDbConnection Connection
	{
		get
		{
			if (_connection == null)
			{
				InitConnection();
			}
			return _connection;
		}
		set
		{
			_connection = value;
			if (Adapter.InsertCommand != null)
			{
				Adapter.InsertCommand.Connection = value;
			}
			if (Adapter.DeleteCommand != null)
			{
				Adapter.DeleteCommand.Connection = value;
			}
			if (Adapter.UpdateCommand != null)
			{
				Adapter.UpdateCommand.Connection = value;
			}
			for (int i = 0; i < CommandCollection.Length; i++)
			{
				if (CommandCollection[i] != null)
				{
					CommandCollection[i].Connection = value;
				}
			}
		}
	}

	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	[DebuggerNonUserCode]
	protected OleDbCommand[] CommandCollection
	{
		get
		{
			if (_commandCollection == null)
			{
				InitCommandCollection();
			}
			return _commandCollection;
		}
	}

	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	[DebuggerNonUserCode]
	public bool ClearBeforeFill
	{
		get
		{
			return _clearBeforeFill;
		}
		set
		{
			_clearBeforeFill = value;
		}
	}

	[DebuggerNonUserCode]
	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	public AllLogsTableAdapter()
	{
		ClearBeforeFill = true;
	}

	[DebuggerNonUserCode]
	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	private void InitAdapter()
	{
		_adapter = new OleDbDataAdapter();
		DataTableMapping dataTableMapping = new DataTableMapping();
		dataTableMapping.SourceTable = "Table";
		dataTableMapping.DataSetTable = "AllLogs";
		dataTableMapping.ColumnMappings.Add("Name", "Name");
		dataTableMapping.ColumnMappings.Add("FID", "FID");
		dataTableMapping.ColumnMappings.Add("DateTime", "DateTime");
		dataTableMapping.ColumnMappings.Add("SID", "SID");
		dataTableMapping.ColumnMappings.Add("Salesman", "Salesman");
		dataTableMapping.ColumnMappings.Add("SubID", "SubID");
		dataTableMapping.ColumnMappings.Add("Price", "Price");
		dataTableMapping.ColumnMappings.Add("PLU", "PLU");
		dataTableMapping.ColumnMappings.Add("Class", "Class");
		dataTableMapping.ColumnMappings.Add("Dept", "Dept");
		dataTableMapping.ColumnMappings.Add("Cost", "Cost");
		dataTableMapping.ColumnMappings.Add("Unit", "Unit");
		dataTableMapping.ColumnMappings.Add("Type", "Type");
		dataTableMapping.ColumnMappings.Add("Tax", "Tax");
		dataTableMapping.ColumnMappings.Add("Text1", "Text1");
		dataTableMapping.ColumnMappings.Add("Text2", "Text2");
		dataTableMapping.ColumnMappings.Add("Text3", "Text3");
		dataTableMapping.ColumnMappings.Add("Text4", "Text4");
		dataTableMapping.ColumnMappings.Add("UnitPrice", "UnitPrice");
		dataTableMapping.ColumnMappings.Add("CoFID", "CoFID");
		dataTableMapping.ColumnMappings.Add("Amount", "Amount");
		dataTableMapping.ColumnMappings.Add("MAC", "MAC");
		dataTableMapping.ColumnMappings.Add("PLUName", "PLUName");
		dataTableMapping.ColumnMappings.Add("TypeName", "TypeName");
		dataTableMapping.ColumnMappings.Add("UnitName", "UnitName");
		_adapter.TableMappings.Add(dataTableMapping);
	}

	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	[DebuggerNonUserCode]
	private void InitConnection()
	{
		_connection = new OleDbConnection();
		_connection.ConnectionString = Settings.Default.ReportConnectionString;
	}

	[DebuggerNonUserCode]
	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	private void InitCommandCollection()
	{
		_commandCollection = new OleDbCommand[1];
		_commandCollection[0] = new OleDbCommand();
		_commandCollection[0].Connection = Connection;
		_commandCollection[0].CommandText = "SELECT TOP 1024 Log.MAC, Device.Name, Log.FID, Log.[DateTime], Log.SID, \r\n      Log.Salesman, LogItem.SubID, LogItem.Price, LogItem.PLU, LogItem.Class, \r\n      LogItem.Dept, LogItem.Cost, LogItem.Amount, LogItem.Unit, LogItem.Type, \r\n      LogItem.Tax, LogItem.Text1, LogItem.Text2, LogItem.Text3, LogItem.Text4, \r\n      LogItem.UnitPrice, LogItem.CoFID, LogItem.PLUName, \r\n      rLogsType.Name AS TypeName, rUnit.Name AS UnitName\r\nFROM ((((Log INNER JOIN\r\n      LogItem ON Log.MAC = LogItem.MAC AND Log.FID = LogItem.FID) INNER JOIN\r\n      Device ON Log.MAC = Device.MAC) LEFT OUTER JOIN\r\n      rLogsType ON LogItem.Type = rLogsType.TypeID) LEFT OUTER JOIN\r\n      rUnit ON LogItem.Unit = rUnit.UnitID)\r\nWHERE (Device.GID >= 1)\r\nORDER BY Log.[DateTime] DESC, LogItem.SubID ASC";
		_commandCollection[0].CommandType = CommandType.Text;
	}

	[DataObjectMethod(DataObjectMethodType.Fill, true)]
	[DebuggerNonUserCode]
	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	[HelpKeyword("vs.data.TableAdapter")]
	public virtual int Fill(ReportDataSet.AllLogsDataTable dataTable)
	{
		Adapter.SelectCommand = CommandCollection[0];
		if (ClearBeforeFill)
		{
			dataTable.Clear();
		}
		return Adapter.Fill(dataTable);
	}
}
