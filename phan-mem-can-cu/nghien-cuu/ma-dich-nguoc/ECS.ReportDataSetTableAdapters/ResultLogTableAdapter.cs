using System.CodeDom.Compiler;
using System.ComponentModel;
using System.ComponentModel.Design;
using System.Data;
using System.Data.Common;
using System.Data.OleDb;
using System.Diagnostics;
using ECS.Properties;

namespace ECS.ReportDataSetTableAdapters;

[DesignerCategory("code")]
[DataObject(true)]
[HelpKeyword("vs.data.TableAdapter")]
[ToolboxItem(true)]
[Designer("Microsoft.VSDesigner.DataSource.Design.TableAdapterDesigner, Microsoft.VSDesigner, Version=10.0.0.0, Culture=neutral, PublicKeyToken=b03f5f7f11d50a3a")]
public class ResultLogTableAdapter : Component
{
	private OleDbDataAdapter _adapter;

	private OleDbConnection _connection;

	private OleDbCommand[] _commandCollection;

	private bool _clearBeforeFill;

	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	[DebuggerNonUserCode]
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

	[DebuggerNonUserCode]
	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
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

	public void SetFilter(string filter)
	{
		InitCommandCollection();
		OleDbCommand[] commandCollection = CommandCollection;
		foreach (OleDbCommand oleDbCommand in commandCollection)
		{
			oleDbCommand.CommandText = oleDbCommand.CommandText.Replace("Device.GID >= 1", filter);
		}
	}

	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	[DebuggerNonUserCode]
	public ResultLogTableAdapter()
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
		dataTableMapping.DataSetTable = "ResultLog";
		dataTableMapping.ColumnMappings.Add("Name", "Name");
		dataTableMapping.ColumnMappings.Add("FID", "FID");
		dataTableMapping.ColumnMappings.Add("DateTime", "DateTime");
		dataTableMapping.ColumnMappings.Add("SID", "SID");
		dataTableMapping.ColumnMappings.Add("Salesman", "Salesman");
		dataTableMapping.ColumnMappings.Add("Cost", "Cost");
		dataTableMapping.ColumnMappings.Add("Tax", "Tax");
		dataTableMapping.ColumnMappings.Add("MAC", "MAC");
		dataTableMapping.ColumnMappings.Add("DisRound", "DisRound");
		dataTableMapping.ColumnMappings.Add("Sfee", "Sfee");
		dataTableMapping.ColumnMappings.Add("Payment_Card", "Payment_Card");
		dataTableMapping.ColumnMappings.Add("Payment_Other_1", "Payment_Other_1");
		dataTableMapping.ColumnMappings.Add("Payment_Other_2", "Payment_Other_2");
		dataTableMapping.ColumnMappings.Add("Payment_Other_3", "Payment_Other_3");
		dataTableMapping.ColumnMappings.Add("Payment_Total", "Payment_Total");
		dataTableMapping.ColumnMappings.Add("SubNo", "SubNo");
		dataTableMapping.ColumnMappings.Add("Alipay", "Alipay");
		dataTableMapping.ColumnMappings.Add("WXpay", "WXpay");
		dataTableMapping.ColumnMappings.Add("Epay2", "Epay2");
		dataTableMapping.ColumnMappings.Add("Epay3", "Epay3");
		dataTableMapping.ColumnMappings.Add("Epay4", "Epay4");
		dataTableMapping.ColumnMappings.Add("Epay5", "Epay5");
		dataTableMapping.ColumnMappings.Add("Epay6", "Epay6");
		dataTableMapping.ColumnMappings.Add("Epay7", "Epay7");
		_adapter.TableMappings.Add(dataTableMapping);
	}

	[DebuggerNonUserCode]
	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
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
		_commandCollection[0].CommandText = "SELECT Log.MAC, Device.Name, Log.FID, Log.[DateTime], Log.SID, Log.Salesman, \r\n      Log.DisRound, Log.Sfee, Log.Payment_Card, Log.Payment_Other_1, \r\n      Log.Payment_Other_2, Log.Payment_Other_3, Log.Payment_Total, Log.Tax, Log.Cost, \r\n      Log.SubNo, Log.Alipay, Log.WXpay, Log.Epay2, Log.Epay3, Log.Epay4, Log.Epay5, \r\n      Log.Epay6, Log.Epay7\r\nFROM (Log INNER JOIN\r\n      Device ON Log.MAC = Device.MAC)\r\nWHERE (Device.GID >= 1)\r\nORDER BY Log.MAC, Log.FID";
		_commandCollection[0].CommandType = CommandType.Text;
	}

	[HelpKeyword("vs.data.TableAdapter")]
	[DebuggerNonUserCode]
	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	[DataObjectMethod(DataObjectMethodType.Fill, true)]
	public virtual int Fill(ReportDataSet.ResultLogDataTable dataTable)
	{
		Adapter.SelectCommand = CommandCollection[0];
		if (ClearBeforeFill)
		{
			dataTable.Clear();
		}
		return Adapter.Fill(dataTable);
	}
}
