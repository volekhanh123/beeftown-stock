using System;
using System.CodeDom.Compiler;
using System.ComponentModel;
using System.ComponentModel.Design;
using System.Data;
using System.Data.Common;
using System.Data.OleDb;
using System.Diagnostics;
using ECS.Properties;

namespace ECS.ReportDataSetTableAdapters;

[HelpKeyword("vs.data.TableAdapter")]
[DesignerCategory("code")]
[ToolboxItem(true)]
[DataObject(true)]
[Designer("Microsoft.VSDesigner.DataSource.Design.TableAdapterDesigner, Microsoft.VSDesigner, Version=10.0.0.0, Culture=neutral, PublicKeyToken=b03f5f7f11d50a3a")]
public class LogTableAdapter : Component
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

	[DebuggerNonUserCode]
	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
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
	public LogTableAdapter()
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
		dataTableMapping.DataSetTable = "Log";
		dataTableMapping.ColumnMappings.Add("MAC", "MAC");
		dataTableMapping.ColumnMappings.Add("FID", "FID");
		dataTableMapping.ColumnMappings.Add("DateTime", "DateTime");
		dataTableMapping.ColumnMappings.Add("SID", "SID");
		dataTableMapping.ColumnMappings.Add("Salesman", "Salesman");
		dataTableMapping.ColumnMappings.Add("DisRound", "DisRound");
		dataTableMapping.ColumnMappings.Add("Sfee", "Sfee");
		dataTableMapping.ColumnMappings.Add("Payment_Card", "Payment_Card");
		dataTableMapping.ColumnMappings.Add("Payment_Other_1", "Payment_Other_1");
		dataTableMapping.ColumnMappings.Add("Payment_Other_2", "Payment_Other_2");
		dataTableMapping.ColumnMappings.Add("Payment_Other_3", "Payment_Other_3");
		dataTableMapping.ColumnMappings.Add("Payment_Total", "Payment_Total");
		dataTableMapping.ColumnMappings.Add("Tax", "Tax");
		dataTableMapping.ColumnMappings.Add("Cost", "Cost");
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
		_adapter.DeleteCommand = new OleDbCommand();
		_adapter.DeleteCommand.Connection = Connection;
		_adapter.DeleteCommand.CommandText = "DELETE FROM `Log` WHERE ((`MAC` = ?) AND (`FID` = ?))";
		_adapter.DeleteCommand.CommandType = CommandType.Text;
		_adapter.DeleteCommand.Parameters.Add(new OleDbParameter("Original_MAC", OleDbType.VarWChar, 0, ParameterDirection.Input, 0, 0, "MAC", DataRowVersion.Original, sourceColumnNullMapping: false, null));
		_adapter.DeleteCommand.Parameters.Add(new OleDbParameter("Original_FID", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "FID", DataRowVersion.Original, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand = new OleDbCommand();
		_adapter.InsertCommand.Connection = Connection;
		_adapter.InsertCommand.CommandText = "INSERT INTO `Log` (`MAC`, `FID`, `DateTime`, `SID`, `Salesman`, `DisRound`, `Sfee`, `Payment_Card`, `Payment_Other_1`, `Payment_Other_2`, `Payment_Other_3`, `Payment_Total`, `Tax`, `Cost`, `SubNo`, `Alipay`, `WXpay`, `Epay2`, `Epay3`, `Epay4`, `Epay5`, `Epay6`, `Epay7`) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
		_adapter.InsertCommand.CommandType = CommandType.Text;
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("MAC", OleDbType.VarWChar, 0, ParameterDirection.Input, 0, 0, "MAC", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("FID", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "FID", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("DateTime", OleDbType.Date, 0, ParameterDirection.Input, 0, 0, "DateTime", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("SID", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "SID", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("Salesman", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "Salesman", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("DisRound", OleDbType.Currency, 0, ParameterDirection.Input, 0, 0, "DisRound", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("Sfee", OleDbType.Currency, 0, ParameterDirection.Input, 0, 0, "Sfee", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("Payment_Card", OleDbType.Currency, 0, ParameterDirection.Input, 0, 0, "Payment_Card", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("Payment_Other_1", OleDbType.Currency, 0, ParameterDirection.Input, 0, 0, "Payment_Other_1", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("Payment_Other_2", OleDbType.Currency, 0, ParameterDirection.Input, 0, 0, "Payment_Other_2", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("Payment_Other_3", OleDbType.Currency, 0, ParameterDirection.Input, 0, 0, "Payment_Other_3", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("Payment_Total", OleDbType.Currency, 0, ParameterDirection.Input, 0, 0, "Payment_Total", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("Tax", OleDbType.Currency, 0, ParameterDirection.Input, 0, 0, "Tax", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("Cost", OleDbType.Currency, 0, ParameterDirection.Input, 0, 0, "Cost", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("SubNo", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "SubNo", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("Alipay", OleDbType.Currency, 0, ParameterDirection.Input, 0, 0, "Alipay", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("WXpay", OleDbType.Currency, 0, ParameterDirection.Input, 0, 0, "WXpay", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("Epay2", OleDbType.Currency, 0, ParameterDirection.Input, 0, 0, "Epay2", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("Epay3", OleDbType.Currency, 0, ParameterDirection.Input, 0, 0, "Epay3", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("Epay4", OleDbType.Currency, 0, ParameterDirection.Input, 0, 0, "Epay4", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("Epay5", OleDbType.Currency, 0, ParameterDirection.Input, 0, 0, "Epay5", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("Epay6", OleDbType.Currency, 0, ParameterDirection.Input, 0, 0, "Epay6", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("Epay7", OleDbType.Currency, 0, ParameterDirection.Input, 0, 0, "Epay7", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand = new OleDbCommand();
		_adapter.UpdateCommand.Connection = Connection;
		_adapter.UpdateCommand.CommandText = "UPDATE `Log` SET `MAC` = ?, `FID` = ?, `DateTime` = ?, `SID` = ?, `Salesman` = ?, `DisRound` = ?, `Sfee` = ?, `Payment_Card` = ?, `Payment_Other_1` = ?, `Payment_Other_2` = ?, `Payment_Other_3` = ?, `Payment_Total` = ?, `Tax` = ?, `Cost` = ?, `SubNo` = ?, `Alipay` = ?, `WXpay` = ?, `Epay2` = ?, `Epay3` = ?, `Epay4` = ?, `Epay5` = ?, `Epay6` = ?, `Epay7` = ? WHERE ((`MAC` = ?) AND (`FID` = ?))";
		_adapter.UpdateCommand.CommandType = CommandType.Text;
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("MAC", OleDbType.VarWChar, 0, ParameterDirection.Input, 0, 0, "MAC", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("FID", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "FID", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("DateTime", OleDbType.Date, 0, ParameterDirection.Input, 0, 0, "DateTime", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("SID", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "SID", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("Salesman", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "Salesman", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("DisRound", OleDbType.Currency, 0, ParameterDirection.Input, 0, 0, "DisRound", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("Sfee", OleDbType.Currency, 0, ParameterDirection.Input, 0, 0, "Sfee", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("Payment_Card", OleDbType.Currency, 0, ParameterDirection.Input, 0, 0, "Payment_Card", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("Payment_Other_1", OleDbType.Currency, 0, ParameterDirection.Input, 0, 0, "Payment_Other_1", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("Payment_Other_2", OleDbType.Currency, 0, ParameterDirection.Input, 0, 0, "Payment_Other_2", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("Payment_Other_3", OleDbType.Currency, 0, ParameterDirection.Input, 0, 0, "Payment_Other_3", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("Payment_Total", OleDbType.Currency, 0, ParameterDirection.Input, 0, 0, "Payment_Total", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("Tax", OleDbType.Currency, 0, ParameterDirection.Input, 0, 0, "Tax", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("Cost", OleDbType.Currency, 0, ParameterDirection.Input, 0, 0, "Cost", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("SubNo", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "SubNo", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("Alipay", OleDbType.Currency, 0, ParameterDirection.Input, 0, 0, "Alipay", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("WXpay", OleDbType.Currency, 0, ParameterDirection.Input, 0, 0, "WXpay", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("Epay2", OleDbType.Currency, 0, ParameterDirection.Input, 0, 0, "Epay2", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("Epay3", OleDbType.Currency, 0, ParameterDirection.Input, 0, 0, "Epay3", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("Epay4", OleDbType.Currency, 0, ParameterDirection.Input, 0, 0, "Epay4", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("Epay5", OleDbType.Currency, 0, ParameterDirection.Input, 0, 0, "Epay5", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("Epay6", OleDbType.Currency, 0, ParameterDirection.Input, 0, 0, "Epay6", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("Epay7", OleDbType.Currency, 0, ParameterDirection.Input, 0, 0, "Epay7", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("Original_MAC", OleDbType.VarWChar, 0, ParameterDirection.Input, 0, 0, "MAC", DataRowVersion.Original, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("Original_FID", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "FID", DataRowVersion.Original, sourceColumnNullMapping: false, null));
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
		_commandCollection = new OleDbCommand[10];
		_commandCollection[0] = new OleDbCommand();
		_commandCollection[0].Connection = Connection;
		_commandCollection[0].CommandText = "SELECT MAC, FID, [DateTime], SID, Salesman, DisRound, Sfee, Payment_Card, \r\n      Payment_Other_1, Payment_Other_2, Payment_Other_3, Payment_Total, Tax, Cost, \r\n      SubNo, Alipay, WXpay, Epay2, Epay3, Epay4, Epay5, Epay6, Epay7\r\nFROM Log";
		_commandCollection[0].CommandType = CommandType.Text;
		_commandCollection[1] = new OleDbCommand();
		_commandCollection[1].Connection = Connection;
		_commandCollection[1].CommandText = "DELETE FROM `Log` WHERE (`DateTime` >= ?)";
		_commandCollection[1].CommandType = CommandType.Text;
		_commandCollection[1].Parameters.Add(new OleDbParameter("DateTime", OleDbType.Date, 0, ParameterDirection.Input, 0, 0, "DateTime", DataRowVersion.Original, sourceColumnNullMapping: false, null));
		_commandCollection[2] = new OleDbCommand();
		_commandCollection[2].Connection = Connection;
		_commandCollection[2].CommandText = "DELETE FROM `Log` WHERE (`DateTime` < ?)";
		_commandCollection[2].CommandType = CommandType.Text;
		_commandCollection[2].Parameters.Add(new OleDbParameter("DateTime", OleDbType.Date, 0, ParameterDirection.Input, 0, 0, "DateTime", DataRowVersion.Original, sourceColumnNullMapping: false, null));
		_commandCollection[3] = new OleDbCommand();
		_commandCollection[3].Connection = Connection;
		_commandCollection[3].CommandText = "DELETE FROM `Log`";
		_commandCollection[3].CommandType = CommandType.Text;
		_commandCollection[4] = new OleDbCommand();
		_commandCollection[4].Connection = Connection;
		_commandCollection[4].CommandText = "SELECT max(DateTime) FROM Log";
		_commandCollection[4].CommandType = CommandType.Text;
		_commandCollection[5] = new OleDbCommand();
		_commandCollection[5].Connection = Connection;
		_commandCollection[5].CommandText = "SELECT min(DateTime) FROM Log";
		_commandCollection[5].CommandType = CommandType.Text;
		_commandCollection[6] = new OleDbCommand();
		_commandCollection[6].Connection = Connection;
		_commandCollection[6].CommandText = "SELECT TOP 1024 Alipay, Cost, [DateTime], DisRound, Epay2, Epay3, Epay4, Epay5, Epay6, Epay7, FID, MAC, Payment_Card, Payment_Other_1, Payment_Other_2, Payment_Other_3, Payment_Total, SID, Salesman, Sfee, SubNo, Tax, WXpay FROM Log WHERE (MAC = CheckMAC)";
		_commandCollection[6].CommandType = CommandType.Text;
		_commandCollection[6].Parameters.Add(new OleDbParameter("CheckMAC", OleDbType.VarWChar, 0, ParameterDirection.Input, 0, 0, null, DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_commandCollection[7] = new OleDbCommand();
		_commandCollection[7].Connection = Connection;
		_commandCollection[7].CommandText = "SELECT Alipay, Cost, [DateTime], DisRound, Epay2, Epay3, Epay4, Epay5, Epay6, Epay7, FID, MAC, Payment_Card, Payment_Other_1, Payment_Other_2, Payment_Other_3, Payment_Total, SID, Salesman, Sfee, SubNo, Tax, WXpay FROM Log WHERE (MAC = CheckMAC) AND (FID >= StartFID) AND (FID <= EndFID)";
		_commandCollection[7].CommandType = CommandType.Text;
		_commandCollection[7].Parameters.Add(new OleDbParameter("CheckMAC", OleDbType.VarWChar, 0, ParameterDirection.Input, 0, 0, null, DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_commandCollection[7].Parameters.Add(new OleDbParameter("StartFID", OleDbType.UnsignedInt, 0, ParameterDirection.Input, 0, 0, null, DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_commandCollection[7].Parameters.Add(new OleDbParameter("EndFID", OleDbType.UnsignedInt, 0, ParameterDirection.Input, 0, 0, null, DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_commandCollection[8] = new OleDbCommand();
		_commandCollection[8].Connection = Connection;
		_commandCollection[8].CommandText = "SELECT Alipay, Cost, [DateTime], DisRound, Epay2, Epay3, Epay4, Epay5, Epay6, Epay7, FID, MAC, Payment_Card, Payment_Other_1, Payment_Other_2, Payment_Other_3, Payment_Total, SID, Salesman, Sfee, SubNo, Tax, WXpay FROM Log WHERE (MAC = CheckMAC) AND (FID = CheckFID)";
		_commandCollection[8].CommandType = CommandType.Text;
		_commandCollection[8].Parameters.Add(new OleDbParameter("CheckMAC", OleDbType.VarWChar, 0, ParameterDirection.Input, 0, 0, null, DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_commandCollection[8].Parameters.Add(new OleDbParameter("CheckFID", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, null, DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_commandCollection[9] = new OleDbCommand();
		_commandCollection[9].Connection = Connection;
		_commandCollection[9].CommandText = "SELECT MAX(FID) FROM Log WHERE (MAC = CheckMAC)";
		_commandCollection[9].CommandType = CommandType.Text;
		_commandCollection[9].Parameters.Add(new OleDbParameter("CheckMAC", OleDbType.VarWChar, 0, ParameterDirection.Input, 0, 0, null, DataRowVersion.Current, sourceColumnNullMapping: false, null));
	}

	[DataObjectMethod(DataObjectMethodType.Fill, true)]
	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	[HelpKeyword("vs.data.TableAdapter")]
	[DebuggerNonUserCode]
	public virtual int Fill(ReportDataSet.LogDataTable dataTable)
	{
		Adapter.SelectCommand = CommandCollection[0];
		if (ClearBeforeFill)
		{
			dataTable.Clear();
		}
		return Adapter.Fill(dataTable);
	}

	[HelpKeyword("vs.data.TableAdapter")]
	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	[DebuggerNonUserCode]
	[DataObjectMethod(DataObjectMethodType.Fill, false)]
	public virtual int FillPartByMAC(ReportDataSet.LogDataTable dataTable, string CheckMAC)
	{
		Adapter.SelectCommand = CommandCollection[6];
		if (CheckMAC == null)
		{
			throw new ArgumentNullException("CheckMAC");
		}
		Adapter.SelectCommand.Parameters[0].Value = CheckMAC;
		if (ClearBeforeFill)
		{
			dataTable.Clear();
		}
		return Adapter.Fill(dataTable);
	}

	[DebuggerNonUserCode]
	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	[HelpKeyword("vs.data.TableAdapter")]
	[DataObjectMethod(DataObjectMethodType.Fill, false)]
	public virtual int FillPartByMACFID(ReportDataSet.LogDataTable dataTable, string CheckMAC, uint StartFID, uint EndFID)
	{
		Adapter.SelectCommand = CommandCollection[7];
		if (CheckMAC == null)
		{
			throw new ArgumentNullException("CheckMAC");
		}
		Adapter.SelectCommand.Parameters[0].Value = CheckMAC;
		Adapter.SelectCommand.Parameters[1].Value = StartFID;
		Adapter.SelectCommand.Parameters[2].Value = EndFID;
		if (ClearBeforeFill)
		{
			dataTable.Clear();
		}
		return Adapter.Fill(dataTable);
	}

	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	[DebuggerNonUserCode]
	[HelpKeyword("vs.data.TableAdapter")]
	[DataObjectMethod(DataObjectMethodType.Select, false)]
	public virtual ReportDataSet.LogDataTable GetDataByMACFID(string CheckMAC, int CheckFID)
	{
		Adapter.SelectCommand = CommandCollection[8];
		if (CheckMAC == null)
		{
			throw new ArgumentNullException("CheckMAC");
		}
		Adapter.SelectCommand.Parameters[0].Value = CheckMAC;
		Adapter.SelectCommand.Parameters[1].Value = CheckFID;
		ReportDataSet.LogDataTable logDataTable = new ReportDataSet.LogDataTable();
		Adapter.Fill(logDataTable);
		return logDataTable;
	}

	[DebuggerNonUserCode]
	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	[HelpKeyword("vs.data.TableAdapter")]
	public virtual int Update(ReportDataSet.LogDataTable dataTable)
	{
		return Adapter.Update(dataTable);
	}

	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	[DebuggerNonUserCode]
	[HelpKeyword("vs.data.TableAdapter")]
	public virtual int Update(ReportDataSet dataSet)
	{
		return Adapter.Update(dataSet, "Log");
	}

	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	[DebuggerNonUserCode]
	[HelpKeyword("vs.data.TableAdapter")]
	public virtual int Update(DataRow dataRow)
	{
		return Adapter.Update(new DataRow[1] { dataRow });
	}

	[DebuggerNonUserCode]
	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	[HelpKeyword("vs.data.TableAdapter")]
	public virtual int Update(DataRow[] dataRows)
	{
		return Adapter.Update(dataRows);
	}

	[DataObjectMethod(DataObjectMethodType.Delete, true)]
	[DebuggerNonUserCode]
	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	[HelpKeyword("vs.data.TableAdapter")]
	public virtual int Delete(string Original_MAC, int? Original_FID)
	{
		if (Original_MAC == null)
		{
			Adapter.DeleteCommand.Parameters[0].Value = DBNull.Value;
		}
		else
		{
			Adapter.DeleteCommand.Parameters[0].Value = Original_MAC;
		}
		if (Original_FID.HasValue)
		{
			Adapter.DeleteCommand.Parameters[1].Value = Original_FID.Value;
		}
		else
		{
			Adapter.DeleteCommand.Parameters[1].Value = DBNull.Value;
		}
		ConnectionState state = Adapter.DeleteCommand.Connection.State;
		if ((Adapter.DeleteCommand.Connection.State & ConnectionState.Open) != ConnectionState.Open)
		{
			Adapter.DeleteCommand.Connection.Open();
		}
		try
		{
			return Adapter.DeleteCommand.ExecuteNonQuery();
		}
		finally
		{
			if (state == ConnectionState.Closed)
			{
				Adapter.DeleteCommand.Connection.Close();
			}
		}
	}

	[DebuggerNonUserCode]
	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	[HelpKeyword("vs.data.TableAdapter")]
	[DataObjectMethod(DataObjectMethodType.Insert, true)]
	public virtual int Insert(string MAC, int? FID, DateTime? DateTime, int? SID, int? Salesman, decimal? DisRound, decimal? Sfee, decimal? Payment_Card, decimal? Payment_Other_1, decimal? Payment_Other_2, decimal? Payment_Other_3, decimal? Payment_Total, decimal? Tax, decimal? Cost, int? SubNo, decimal? Alipay, decimal? WXpay, decimal? Epay2, decimal? Epay3, decimal? Epay4, decimal? Epay5, decimal? Epay6, decimal? Epay7)
	{
		if (MAC == null)
		{
			Adapter.InsertCommand.Parameters[0].Value = DBNull.Value;
		}
		else
		{
			Adapter.InsertCommand.Parameters[0].Value = MAC;
		}
		if (FID.HasValue)
		{
			Adapter.InsertCommand.Parameters[1].Value = FID.Value;
		}
		else
		{
			Adapter.InsertCommand.Parameters[1].Value = DBNull.Value;
		}
		if (DateTime.HasValue)
		{
			Adapter.InsertCommand.Parameters[2].Value = DateTime.Value;
		}
		else
		{
			Adapter.InsertCommand.Parameters[2].Value = DBNull.Value;
		}
		if (SID.HasValue)
		{
			Adapter.InsertCommand.Parameters[3].Value = SID.Value;
		}
		else
		{
			Adapter.InsertCommand.Parameters[3].Value = DBNull.Value;
		}
		if (Salesman.HasValue)
		{
			Adapter.InsertCommand.Parameters[4].Value = Salesman.Value;
		}
		else
		{
			Adapter.InsertCommand.Parameters[4].Value = DBNull.Value;
		}
		if (DisRound.HasValue)
		{
			Adapter.InsertCommand.Parameters[5].Value = DisRound.Value;
		}
		else
		{
			Adapter.InsertCommand.Parameters[5].Value = DBNull.Value;
		}
		if (Sfee.HasValue)
		{
			Adapter.InsertCommand.Parameters[6].Value = Sfee.Value;
		}
		else
		{
			Adapter.InsertCommand.Parameters[6].Value = DBNull.Value;
		}
		if (Payment_Card.HasValue)
		{
			Adapter.InsertCommand.Parameters[7].Value = Payment_Card.Value;
		}
		else
		{
			Adapter.InsertCommand.Parameters[7].Value = DBNull.Value;
		}
		if (Payment_Other_1.HasValue)
		{
			Adapter.InsertCommand.Parameters[8].Value = Payment_Other_1.Value;
		}
		else
		{
			Adapter.InsertCommand.Parameters[8].Value = DBNull.Value;
		}
		if (Payment_Other_2.HasValue)
		{
			Adapter.InsertCommand.Parameters[9].Value = Payment_Other_2.Value;
		}
		else
		{
			Adapter.InsertCommand.Parameters[9].Value = DBNull.Value;
		}
		if (Payment_Other_3.HasValue)
		{
			Adapter.InsertCommand.Parameters[10].Value = Payment_Other_3.Value;
		}
		else
		{
			Adapter.InsertCommand.Parameters[10].Value = DBNull.Value;
		}
		if (Payment_Total.HasValue)
		{
			Adapter.InsertCommand.Parameters[11].Value = Payment_Total.Value;
		}
		else
		{
			Adapter.InsertCommand.Parameters[11].Value = DBNull.Value;
		}
		if (Tax.HasValue)
		{
			Adapter.InsertCommand.Parameters[12].Value = Tax.Value;
		}
		else
		{
			Adapter.InsertCommand.Parameters[12].Value = DBNull.Value;
		}
		if (Cost.HasValue)
		{
			Adapter.InsertCommand.Parameters[13].Value = Cost.Value;
		}
		else
		{
			Adapter.InsertCommand.Parameters[13].Value = DBNull.Value;
		}
		if (SubNo.HasValue)
		{
			Adapter.InsertCommand.Parameters[14].Value = SubNo.Value;
		}
		else
		{
			Adapter.InsertCommand.Parameters[14].Value = DBNull.Value;
		}
		if (Alipay.HasValue)
		{
			Adapter.InsertCommand.Parameters[15].Value = Alipay.Value;
		}
		else
		{
			Adapter.InsertCommand.Parameters[15].Value = DBNull.Value;
		}
		if (WXpay.HasValue)
		{
			Adapter.InsertCommand.Parameters[16].Value = WXpay.Value;
		}
		else
		{
			Adapter.InsertCommand.Parameters[16].Value = DBNull.Value;
		}
		if (Epay2.HasValue)
		{
			Adapter.InsertCommand.Parameters[17].Value = Epay2.Value;
		}
		else
		{
			Adapter.InsertCommand.Parameters[17].Value = DBNull.Value;
		}
		if (Epay3.HasValue)
		{
			Adapter.InsertCommand.Parameters[18].Value = Epay3.Value;
		}
		else
		{
			Adapter.InsertCommand.Parameters[18].Value = DBNull.Value;
		}
		if (Epay4.HasValue)
		{
			Adapter.InsertCommand.Parameters[19].Value = Epay4.Value;
		}
		else
		{
			Adapter.InsertCommand.Parameters[19].Value = DBNull.Value;
		}
		if (Epay5.HasValue)
		{
			Adapter.InsertCommand.Parameters[20].Value = Epay5.Value;
		}
		else
		{
			Adapter.InsertCommand.Parameters[20].Value = DBNull.Value;
		}
		if (Epay6.HasValue)
		{
			Adapter.InsertCommand.Parameters[21].Value = Epay6.Value;
		}
		else
		{
			Adapter.InsertCommand.Parameters[21].Value = DBNull.Value;
		}
		if (Epay7.HasValue)
		{
			Adapter.InsertCommand.Parameters[22].Value = Epay7.Value;
		}
		else
		{
			Adapter.InsertCommand.Parameters[22].Value = DBNull.Value;
		}
		ConnectionState state = Adapter.InsertCommand.Connection.State;
		if ((Adapter.InsertCommand.Connection.State & ConnectionState.Open) != ConnectionState.Open)
		{
			Adapter.InsertCommand.Connection.Open();
		}
		try
		{
			return Adapter.InsertCommand.ExecuteNonQuery();
		}
		finally
		{
			if (state == ConnectionState.Closed)
			{
				Adapter.InsertCommand.Connection.Close();
			}
		}
	}

	[DataObjectMethod(DataObjectMethodType.Update, true)]
	[DebuggerNonUserCode]
	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	[HelpKeyword("vs.data.TableAdapter")]
	public virtual int Update(string MAC, int? FID, DateTime? DateTime, int? SID, int? Salesman, decimal? DisRound, decimal? Sfee, decimal? Payment_Card, decimal? Payment_Other_1, decimal? Payment_Other_2, decimal? Payment_Other_3, decimal? Payment_Total, decimal? Tax, decimal? Cost, int? SubNo, decimal? Alipay, decimal? WXpay, decimal? Epay2, decimal? Epay3, decimal? Epay4, decimal? Epay5, decimal? Epay6, decimal? Epay7, string Original_MAC, int? Original_FID)
	{
		if (MAC == null)
		{
			Adapter.UpdateCommand.Parameters[0].Value = DBNull.Value;
		}
		else
		{
			Adapter.UpdateCommand.Parameters[0].Value = MAC;
		}
		if (FID.HasValue)
		{
			Adapter.UpdateCommand.Parameters[1].Value = FID.Value;
		}
		else
		{
			Adapter.UpdateCommand.Parameters[1].Value = DBNull.Value;
		}
		if (DateTime.HasValue)
		{
			Adapter.UpdateCommand.Parameters[2].Value = DateTime.Value;
		}
		else
		{
			Adapter.UpdateCommand.Parameters[2].Value = DBNull.Value;
		}
		if (SID.HasValue)
		{
			Adapter.UpdateCommand.Parameters[3].Value = SID.Value;
		}
		else
		{
			Adapter.UpdateCommand.Parameters[3].Value = DBNull.Value;
		}
		if (Salesman.HasValue)
		{
			Adapter.UpdateCommand.Parameters[4].Value = Salesman.Value;
		}
		else
		{
			Adapter.UpdateCommand.Parameters[4].Value = DBNull.Value;
		}
		if (DisRound.HasValue)
		{
			Adapter.UpdateCommand.Parameters[5].Value = DisRound.Value;
		}
		else
		{
			Adapter.UpdateCommand.Parameters[5].Value = DBNull.Value;
		}
		if (Sfee.HasValue)
		{
			Adapter.UpdateCommand.Parameters[6].Value = Sfee.Value;
		}
		else
		{
			Adapter.UpdateCommand.Parameters[6].Value = DBNull.Value;
		}
		if (Payment_Card.HasValue)
		{
			Adapter.UpdateCommand.Parameters[7].Value = Payment_Card.Value;
		}
		else
		{
			Adapter.UpdateCommand.Parameters[7].Value = DBNull.Value;
		}
		if (Payment_Other_1.HasValue)
		{
			Adapter.UpdateCommand.Parameters[8].Value = Payment_Other_1.Value;
		}
		else
		{
			Adapter.UpdateCommand.Parameters[8].Value = DBNull.Value;
		}
		if (Payment_Other_2.HasValue)
		{
			Adapter.UpdateCommand.Parameters[9].Value = Payment_Other_2.Value;
		}
		else
		{
			Adapter.UpdateCommand.Parameters[9].Value = DBNull.Value;
		}
		if (Payment_Other_3.HasValue)
		{
			Adapter.UpdateCommand.Parameters[10].Value = Payment_Other_3.Value;
		}
		else
		{
			Adapter.UpdateCommand.Parameters[10].Value = DBNull.Value;
		}
		if (Payment_Total.HasValue)
		{
			Adapter.UpdateCommand.Parameters[11].Value = Payment_Total.Value;
		}
		else
		{
			Adapter.UpdateCommand.Parameters[11].Value = DBNull.Value;
		}
		if (Tax.HasValue)
		{
			Adapter.UpdateCommand.Parameters[12].Value = Tax.Value;
		}
		else
		{
			Adapter.UpdateCommand.Parameters[12].Value = DBNull.Value;
		}
		if (Cost.HasValue)
		{
			Adapter.UpdateCommand.Parameters[13].Value = Cost.Value;
		}
		else
		{
			Adapter.UpdateCommand.Parameters[13].Value = DBNull.Value;
		}
		if (SubNo.HasValue)
		{
			Adapter.UpdateCommand.Parameters[14].Value = SubNo.Value;
		}
		else
		{
			Adapter.UpdateCommand.Parameters[14].Value = DBNull.Value;
		}
		if (Alipay.HasValue)
		{
			Adapter.UpdateCommand.Parameters[15].Value = Alipay.Value;
		}
		else
		{
			Adapter.UpdateCommand.Parameters[15].Value = DBNull.Value;
		}
		if (WXpay.HasValue)
		{
			Adapter.UpdateCommand.Parameters[16].Value = WXpay.Value;
		}
		else
		{
			Adapter.UpdateCommand.Parameters[16].Value = DBNull.Value;
		}
		if (Epay2.HasValue)
		{
			Adapter.UpdateCommand.Parameters[17].Value = Epay2.Value;
		}
		else
		{
			Adapter.UpdateCommand.Parameters[17].Value = DBNull.Value;
		}
		if (Epay3.HasValue)
		{
			Adapter.UpdateCommand.Parameters[18].Value = Epay3.Value;
		}
		else
		{
			Adapter.UpdateCommand.Parameters[18].Value = DBNull.Value;
		}
		if (Epay4.HasValue)
		{
			Adapter.UpdateCommand.Parameters[19].Value = Epay4.Value;
		}
		else
		{
			Adapter.UpdateCommand.Parameters[19].Value = DBNull.Value;
		}
		if (Epay5.HasValue)
		{
			Adapter.UpdateCommand.Parameters[20].Value = Epay5.Value;
		}
		else
		{
			Adapter.UpdateCommand.Parameters[20].Value = DBNull.Value;
		}
		if (Epay6.HasValue)
		{
			Adapter.UpdateCommand.Parameters[21].Value = Epay6.Value;
		}
		else
		{
			Adapter.UpdateCommand.Parameters[21].Value = DBNull.Value;
		}
		if (Epay7.HasValue)
		{
			Adapter.UpdateCommand.Parameters[22].Value = Epay7.Value;
		}
		else
		{
			Adapter.UpdateCommand.Parameters[22].Value = DBNull.Value;
		}
		if (Original_MAC == null)
		{
			Adapter.UpdateCommand.Parameters[23].Value = DBNull.Value;
		}
		else
		{
			Adapter.UpdateCommand.Parameters[23].Value = Original_MAC;
		}
		if (Original_FID.HasValue)
		{
			Adapter.UpdateCommand.Parameters[24].Value = Original_FID.Value;
		}
		else
		{
			Adapter.UpdateCommand.Parameters[24].Value = DBNull.Value;
		}
		ConnectionState state = Adapter.UpdateCommand.Connection.State;
		if ((Adapter.UpdateCommand.Connection.State & ConnectionState.Open) != ConnectionState.Open)
		{
			Adapter.UpdateCommand.Connection.Open();
		}
		try
		{
			return Adapter.UpdateCommand.ExecuteNonQuery();
		}
		finally
		{
			if (state == ConnectionState.Closed)
			{
				Adapter.UpdateCommand.Connection.Close();
			}
		}
	}

	[DataObjectMethod(DataObjectMethodType.Update, true)]
	[DebuggerNonUserCode]
	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	[HelpKeyword("vs.data.TableAdapter")]
	public virtual int Update(DateTime? DateTime, int? SID, int? Salesman, decimal? DisRound, decimal? Sfee, decimal? Payment_Card, decimal? Payment_Other_1, decimal? Payment_Other_2, decimal? Payment_Other_3, decimal? Payment_Total, decimal? Tax, decimal? Cost, int? SubNo, decimal? Alipay, decimal? WXpay, decimal? Epay2, decimal? Epay3, decimal? Epay4, decimal? Epay5, decimal? Epay6, decimal? Epay7, string Original_MAC, int? Original_FID)
	{
		return Update(Original_MAC, Original_FID, DateTime, SID, Salesman, DisRound, Sfee, Payment_Card, Payment_Other_1, Payment_Other_2, Payment_Other_3, Payment_Total, Tax, Cost, SubNo, Alipay, WXpay, Epay2, Epay3, Epay4, Epay5, Epay6, Epay7, Original_MAC, Original_FID);
	}

	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	[DebuggerNonUserCode]
	[DataObjectMethod(DataObjectMethodType.Delete, false)]
	[HelpKeyword("vs.data.TableAdapter")]
	public virtual int Delete_DT_BigE(DateTime? DateTime)
	{
		OleDbCommand oleDbCommand = CommandCollection[1];
		if (DateTime.HasValue)
		{
			oleDbCommand.Parameters[0].Value = DateTime.Value;
		}
		else
		{
			oleDbCommand.Parameters[0].Value = DBNull.Value;
		}
		ConnectionState state = oleDbCommand.Connection.State;
		if ((oleDbCommand.Connection.State & ConnectionState.Open) != ConnectionState.Open)
		{
			oleDbCommand.Connection.Open();
		}
		try
		{
			return oleDbCommand.ExecuteNonQuery();
		}
		finally
		{
			if (state == ConnectionState.Closed)
			{
				oleDbCommand.Connection.Close();
			}
		}
	}

	[DebuggerNonUserCode]
	[DataObjectMethod(DataObjectMethodType.Delete, false)]
	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	[HelpKeyword("vs.data.TableAdapter")]
	public virtual int Delete_DT_Small(DateTime? DateTime)
	{
		OleDbCommand oleDbCommand = CommandCollection[2];
		if (DateTime.HasValue)
		{
			oleDbCommand.Parameters[0].Value = DateTime.Value;
		}
		else
		{
			oleDbCommand.Parameters[0].Value = DBNull.Value;
		}
		ConnectionState state = oleDbCommand.Connection.State;
		if ((oleDbCommand.Connection.State & ConnectionState.Open) != ConnectionState.Open)
		{
			oleDbCommand.Connection.Open();
		}
		try
		{
			return oleDbCommand.ExecuteNonQuery();
		}
		finally
		{
			if (state == ConnectionState.Closed)
			{
				oleDbCommand.Connection.Close();
			}
		}
	}

	[DataObjectMethod(DataObjectMethodType.Delete, false)]
	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	[HelpKeyword("vs.data.TableAdapter")]
	[DebuggerNonUserCode]
	public virtual int DeleteAll()
	{
		OleDbCommand oleDbCommand = CommandCollection[3];
		ConnectionState state = oleDbCommand.Connection.State;
		if ((oleDbCommand.Connection.State & ConnectionState.Open) != ConnectionState.Open)
		{
			oleDbCommand.Connection.Open();
		}
		try
		{
			return oleDbCommand.ExecuteNonQuery();
		}
		finally
		{
			if (state == ConnectionState.Closed)
			{
				oleDbCommand.Connection.Close();
			}
		}
	}

	[DebuggerNonUserCode]
	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	[HelpKeyword("vs.data.TableAdapter")]
	public virtual DateTime? DT_Max()
	{
		OleDbCommand oleDbCommand = CommandCollection[4];
		ConnectionState state = oleDbCommand.Connection.State;
		if ((oleDbCommand.Connection.State & ConnectionState.Open) != ConnectionState.Open)
		{
			oleDbCommand.Connection.Open();
		}
		object obj;
		try
		{
			obj = oleDbCommand.ExecuteScalar();
		}
		finally
		{
			if (state == ConnectionState.Closed)
			{
				oleDbCommand.Connection.Close();
			}
		}
		if (obj == null || obj.GetType() == typeof(DBNull))
		{
			return null;
		}
		return (DateTime)obj;
	}

	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	[HelpKeyword("vs.data.TableAdapter")]
	[DebuggerNonUserCode]
	public virtual DateTime? DT_Min()
	{
		OleDbCommand oleDbCommand = CommandCollection[5];
		ConnectionState state = oleDbCommand.Connection.State;
		if ((oleDbCommand.Connection.State & ConnectionState.Open) != ConnectionState.Open)
		{
			oleDbCommand.Connection.Open();
		}
		object obj;
		try
		{
			obj = oleDbCommand.ExecuteScalar();
		}
		finally
		{
			if (state == ConnectionState.Closed)
			{
				oleDbCommand.Connection.Close();
			}
		}
		if (obj == null || obj.GetType() == typeof(DBNull))
		{
			return null;
		}
		return (DateTime)obj;
	}

	[HelpKeyword("vs.data.TableAdapter")]
	[DebuggerNonUserCode]
	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	public virtual int? GetMaxFID(string CheckMAC)
	{
		OleDbCommand oleDbCommand = CommandCollection[9];
		if (CheckMAC == null)
		{
			throw new ArgumentNullException("CheckMAC");
		}
		oleDbCommand.Parameters[0].Value = CheckMAC;
		ConnectionState state = oleDbCommand.Connection.State;
		if ((oleDbCommand.Connection.State & ConnectionState.Open) != ConnectionState.Open)
		{
			oleDbCommand.Connection.Open();
		}
		object obj;
		try
		{
			obj = oleDbCommand.ExecuteScalar();
		}
		finally
		{
			if (state == ConnectionState.Closed)
			{
				oleDbCommand.Connection.Close();
			}
		}
		if (obj == null || obj.GetType() == typeof(DBNull))
		{
			return null;
		}
		return (int)obj;
	}
}
