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

[Designer("Microsoft.VSDesigner.DataSource.Design.TableAdapterDesigner, Microsoft.VSDesigner, Version=10.0.0.0, Culture=neutral, PublicKeyToken=b03f5f7f11d50a3a")]
[DesignerCategory("code")]
[ToolboxItem(true)]
[HelpKeyword("vs.data.TableAdapter")]
[DataObject(true)]
public class rUnitTableAdapter : Component
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

	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	[DebuggerNonUserCode]
	public rUnitTableAdapter()
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
		dataTableMapping.DataSetTable = "rUnit";
		dataTableMapping.ColumnMappings.Add("UnitID", "UnitID");
		dataTableMapping.ColumnMappings.Add("Amount", "Amount");
		dataTableMapping.ColumnMappings.Add("Pamount", "Pamount");
		dataTableMapping.ColumnMappings.Add("Name", "Name");
		dataTableMapping.ColumnMappings.Add("Punit", "Punit");
		dataTableMapping.ColumnMappings.Add("Pack", "Pack");
		dataTableMapping.ColumnMappings.Add("FlagP", "FlagP");
		dataTableMapping.ColumnMappings.Add("FlagA", "FlagA");
		_adapter.TableMappings.Add(dataTableMapping);
		_adapter.DeleteCommand = new OleDbCommand();
		_adapter.DeleteCommand.Connection = Connection;
		_adapter.DeleteCommand.CommandText = "DELETE FROM `rUnit` WHERE ((`UnitID` = ?) AND ((? = 1 AND `Amount` IS NULL) OR (`Amount` = ?)) AND ((? = 1 AND `Pamount` IS NULL) OR (`Pamount` = ?)) AND ((? = 1 AND `Name` IS NULL) OR (`Name` = ?)) AND ((? = 1 AND `Punit` IS NULL) OR (`Punit` = ?)) AND ((? = 1 AND `Pack` IS NULL) OR (`Pack` = ?)) AND ((? = 1 AND `FlagP` IS NULL) OR (`FlagP` = ?)) AND ((? = 1 AND `FlagA` IS NULL) OR (`FlagA` = ?)))";
		_adapter.DeleteCommand.CommandType = CommandType.Text;
		_adapter.DeleteCommand.Parameters.Add(new OleDbParameter("Original_UnitID", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "UnitID", DataRowVersion.Original, sourceColumnNullMapping: false, null));
		_adapter.DeleteCommand.Parameters.Add(new OleDbParameter("IsNull_Amount", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "Amount", DataRowVersion.Original, sourceColumnNullMapping: true, null));
		_adapter.DeleteCommand.Parameters.Add(new OleDbParameter("Original_Amount", OleDbType.VarWChar, 0, ParameterDirection.Input, 0, 0, "Amount", DataRowVersion.Original, sourceColumnNullMapping: false, null));
		_adapter.DeleteCommand.Parameters.Add(new OleDbParameter("IsNull_Pamount", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "Pamount", DataRowVersion.Original, sourceColumnNullMapping: true, null));
		_adapter.DeleteCommand.Parameters.Add(new OleDbParameter("Original_Pamount", OleDbType.VarWChar, 0, ParameterDirection.Input, 0, 0, "Pamount", DataRowVersion.Original, sourceColumnNullMapping: false, null));
		_adapter.DeleteCommand.Parameters.Add(new OleDbParameter("IsNull_Name", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "Name", DataRowVersion.Original, sourceColumnNullMapping: true, null));
		_adapter.DeleteCommand.Parameters.Add(new OleDbParameter("Original_Name", OleDbType.VarWChar, 0, ParameterDirection.Input, 0, 0, "Name", DataRowVersion.Original, sourceColumnNullMapping: false, null));
		_adapter.DeleteCommand.Parameters.Add(new OleDbParameter("IsNull_Punit", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "Punit", DataRowVersion.Original, sourceColumnNullMapping: true, null));
		_adapter.DeleteCommand.Parameters.Add(new OleDbParameter("Original_Punit", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "Punit", DataRowVersion.Original, sourceColumnNullMapping: false, null));
		_adapter.DeleteCommand.Parameters.Add(new OleDbParameter("IsNull_Pack", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "Pack", DataRowVersion.Original, sourceColumnNullMapping: true, null));
		_adapter.DeleteCommand.Parameters.Add(new OleDbParameter("Original_Pack", OleDbType.Currency, 0, ParameterDirection.Input, 0, 0, "Pack", DataRowVersion.Original, sourceColumnNullMapping: false, null));
		_adapter.DeleteCommand.Parameters.Add(new OleDbParameter("IsNull_FlagP", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "FlagP", DataRowVersion.Original, sourceColumnNullMapping: true, null));
		_adapter.DeleteCommand.Parameters.Add(new OleDbParameter("Original_FlagP", OleDbType.Boolean, 0, ParameterDirection.Input, 0, 0, "FlagP", DataRowVersion.Original, sourceColumnNullMapping: false, null));
		_adapter.DeleteCommand.Parameters.Add(new OleDbParameter("IsNull_FlagA", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "FlagA", DataRowVersion.Original, sourceColumnNullMapping: true, null));
		_adapter.DeleteCommand.Parameters.Add(new OleDbParameter("Original_FlagA", OleDbType.Boolean, 0, ParameterDirection.Input, 0, 0, "FlagA", DataRowVersion.Original, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand = new OleDbCommand();
		_adapter.InsertCommand.Connection = Connection;
		_adapter.InsertCommand.CommandText = "INSERT INTO `rUnit` (`UnitID`, `Amount`, `Pamount`, `Name`, `Punit`, `Pack`, `FlagP`, `FlagA`) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
		_adapter.InsertCommand.CommandType = CommandType.Text;
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("UnitID", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "UnitID", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("Amount", OleDbType.VarWChar, 0, ParameterDirection.Input, 0, 0, "Amount", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("Pamount", OleDbType.VarWChar, 0, ParameterDirection.Input, 0, 0, "Pamount", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("Name", OleDbType.VarWChar, 0, ParameterDirection.Input, 0, 0, "Name", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("Punit", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "Punit", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("Pack", OleDbType.Currency, 0, ParameterDirection.Input, 0, 0, "Pack", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("FlagP", OleDbType.Boolean, 0, ParameterDirection.Input, 0, 0, "FlagP", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("FlagA", OleDbType.Boolean, 0, ParameterDirection.Input, 0, 0, "FlagA", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand = new OleDbCommand();
		_adapter.UpdateCommand.Connection = Connection;
		_adapter.UpdateCommand.CommandText = "UPDATE `rUnit` SET `UnitID` = ?, `Amount` = ?, `Pamount` = ?, `Name` = ?, `Punit` = ?, `Pack` = ?, `FlagP` = ?, `FlagA` = ? WHERE ((`UnitID` = ?) AND ((? = 1 AND `Amount` IS NULL) OR (`Amount` = ?)) AND ((? = 1 AND `Pamount` IS NULL) OR (`Pamount` = ?)) AND ((? = 1 AND `Name` IS NULL) OR (`Name` = ?)) AND ((? = 1 AND `Punit` IS NULL) OR (`Punit` = ?)) AND ((? = 1 AND `Pack` IS NULL) OR (`Pack` = ?)) AND ((? = 1 AND `FlagP` IS NULL) OR (`FlagP` = ?)) AND ((? = 1 AND `FlagA` IS NULL) OR (`FlagA` = ?)))";
		_adapter.UpdateCommand.CommandType = CommandType.Text;
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("UnitID", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "UnitID", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("Amount", OleDbType.VarWChar, 0, ParameterDirection.Input, 0, 0, "Amount", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("Pamount", OleDbType.VarWChar, 0, ParameterDirection.Input, 0, 0, "Pamount", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("Name", OleDbType.VarWChar, 0, ParameterDirection.Input, 0, 0, "Name", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("Punit", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "Punit", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("Pack", OleDbType.Currency, 0, ParameterDirection.Input, 0, 0, "Pack", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("FlagP", OleDbType.Boolean, 0, ParameterDirection.Input, 0, 0, "FlagP", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("FlagA", OleDbType.Boolean, 0, ParameterDirection.Input, 0, 0, "FlagA", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("Original_UnitID", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "UnitID", DataRowVersion.Original, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("IsNull_Amount", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "Amount", DataRowVersion.Original, sourceColumnNullMapping: true, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("Original_Amount", OleDbType.VarWChar, 0, ParameterDirection.Input, 0, 0, "Amount", DataRowVersion.Original, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("IsNull_Pamount", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "Pamount", DataRowVersion.Original, sourceColumnNullMapping: true, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("Original_Pamount", OleDbType.VarWChar, 0, ParameterDirection.Input, 0, 0, "Pamount", DataRowVersion.Original, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("IsNull_Name", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "Name", DataRowVersion.Original, sourceColumnNullMapping: true, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("Original_Name", OleDbType.VarWChar, 0, ParameterDirection.Input, 0, 0, "Name", DataRowVersion.Original, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("IsNull_Punit", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "Punit", DataRowVersion.Original, sourceColumnNullMapping: true, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("Original_Punit", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "Punit", DataRowVersion.Original, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("IsNull_Pack", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "Pack", DataRowVersion.Original, sourceColumnNullMapping: true, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("Original_Pack", OleDbType.Currency, 0, ParameterDirection.Input, 0, 0, "Pack", DataRowVersion.Original, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("IsNull_FlagP", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "FlagP", DataRowVersion.Original, sourceColumnNullMapping: true, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("Original_FlagP", OleDbType.Boolean, 0, ParameterDirection.Input, 0, 0, "FlagP", DataRowVersion.Original, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("IsNull_FlagA", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "FlagA", DataRowVersion.Original, sourceColumnNullMapping: true, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("Original_FlagA", OleDbType.Boolean, 0, ParameterDirection.Input, 0, 0, "FlagA", DataRowVersion.Original, sourceColumnNullMapping: false, null));
	}

	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	[DebuggerNonUserCode]
	private void InitConnection()
	{
		_connection = new OleDbConnection();
		_connection.ConnectionString = Settings.Default.ReportConnectionString;
	}

	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	[DebuggerNonUserCode]
	private void InitCommandCollection()
	{
		_commandCollection = new OleDbCommand[1];
		_commandCollection[0] = new OleDbCommand();
		_commandCollection[0].Connection = Connection;
		_commandCollection[0].CommandText = "SELECT UnitID, Amount, Pamount, Name, Punit, Pack, FlagP, FlagA\r\nFROM rUnit";
		_commandCollection[0].CommandType = CommandType.Text;
	}

	[DebuggerNonUserCode]
	[DataObjectMethod(DataObjectMethodType.Fill, true)]
	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	[HelpKeyword("vs.data.TableAdapter")]
	public virtual int Fill(ReportDataSet.rUnitDataTable dataTable)
	{
		Adapter.SelectCommand = CommandCollection[0];
		if (ClearBeforeFill)
		{
			dataTable.Clear();
		}
		return Adapter.Fill(dataTable);
	}

	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	[HelpKeyword("vs.data.TableAdapter")]
	[DebuggerNonUserCode]
	public virtual int Update(ReportDataSet.rUnitDataTable dataTable)
	{
		return Adapter.Update(dataTable);
	}

	[DebuggerNonUserCode]
	[HelpKeyword("vs.data.TableAdapter")]
	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	public virtual int Update(ReportDataSet dataSet)
	{
		return Adapter.Update(dataSet, "rUnit");
	}

	[HelpKeyword("vs.data.TableAdapter")]
	[DebuggerNonUserCode]
	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	public virtual int Update(DataRow dataRow)
	{
		return Adapter.Update(new DataRow[1] { dataRow });
	}

	[HelpKeyword("vs.data.TableAdapter")]
	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	[DebuggerNonUserCode]
	public virtual int Update(DataRow[] dataRows)
	{
		return Adapter.Update(dataRows);
	}

	[DataObjectMethod(DataObjectMethodType.Delete, true)]
	[HelpKeyword("vs.data.TableAdapter")]
	[DebuggerNonUserCode]
	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	public virtual int Delete(int? Original_UnitID, string Original_Amount, string Original_Pamount, string Original_Name, int? Original_Punit, decimal? Original_Pack, bool Original_FlagP, bool Original_FlagA)
	{
		if (Original_UnitID.HasValue)
		{
			Adapter.DeleteCommand.Parameters[0].Value = Original_UnitID.Value;
		}
		else
		{
			Adapter.DeleteCommand.Parameters[0].Value = DBNull.Value;
		}
		if (Original_Amount == null)
		{
			Adapter.DeleteCommand.Parameters[1].Value = 1;
			Adapter.DeleteCommand.Parameters[2].Value = DBNull.Value;
		}
		else
		{
			Adapter.DeleteCommand.Parameters[1].Value = 0;
			Adapter.DeleteCommand.Parameters[2].Value = Original_Amount;
		}
		if (Original_Pamount == null)
		{
			Adapter.DeleteCommand.Parameters[3].Value = 1;
			Adapter.DeleteCommand.Parameters[4].Value = DBNull.Value;
		}
		else
		{
			Adapter.DeleteCommand.Parameters[3].Value = 0;
			Adapter.DeleteCommand.Parameters[4].Value = Original_Pamount;
		}
		if (Original_Name == null)
		{
			Adapter.DeleteCommand.Parameters[5].Value = 1;
			Adapter.DeleteCommand.Parameters[6].Value = DBNull.Value;
		}
		else
		{
			Adapter.DeleteCommand.Parameters[5].Value = 0;
			Adapter.DeleteCommand.Parameters[6].Value = Original_Name;
		}
		if (Original_Punit.HasValue)
		{
			Adapter.DeleteCommand.Parameters[7].Value = 0;
			Adapter.DeleteCommand.Parameters[8].Value = Original_Punit.Value;
		}
		else
		{
			Adapter.DeleteCommand.Parameters[7].Value = 1;
			Adapter.DeleteCommand.Parameters[8].Value = DBNull.Value;
		}
		if (Original_Pack.HasValue)
		{
			Adapter.DeleteCommand.Parameters[9].Value = 0;
			Adapter.DeleteCommand.Parameters[10].Value = Original_Pack.Value;
		}
		else
		{
			Adapter.DeleteCommand.Parameters[9].Value = 1;
			Adapter.DeleteCommand.Parameters[10].Value = DBNull.Value;
		}
		Adapter.DeleteCommand.Parameters[11].Value = 0;
		Adapter.DeleteCommand.Parameters[12].Value = Original_FlagP;
		Adapter.DeleteCommand.Parameters[13].Value = 0;
		Adapter.DeleteCommand.Parameters[14].Value = Original_FlagA;
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

	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	[DataObjectMethod(DataObjectMethodType.Insert, true)]
	[HelpKeyword("vs.data.TableAdapter")]
	[DebuggerNonUserCode]
	public virtual int Insert(int? UnitID, string Amount, string Pamount, string Name, int? Punit, decimal? Pack, bool FlagP, bool FlagA)
	{
		if (UnitID.HasValue)
		{
			Adapter.InsertCommand.Parameters[0].Value = UnitID.Value;
		}
		else
		{
			Adapter.InsertCommand.Parameters[0].Value = DBNull.Value;
		}
		if (Amount == null)
		{
			Adapter.InsertCommand.Parameters[1].Value = DBNull.Value;
		}
		else
		{
			Adapter.InsertCommand.Parameters[1].Value = Amount;
		}
		if (Pamount == null)
		{
			Adapter.InsertCommand.Parameters[2].Value = DBNull.Value;
		}
		else
		{
			Adapter.InsertCommand.Parameters[2].Value = Pamount;
		}
		if (Name == null)
		{
			Adapter.InsertCommand.Parameters[3].Value = DBNull.Value;
		}
		else
		{
			Adapter.InsertCommand.Parameters[3].Value = Name;
		}
		if (Punit.HasValue)
		{
			Adapter.InsertCommand.Parameters[4].Value = Punit.Value;
		}
		else
		{
			Adapter.InsertCommand.Parameters[4].Value = DBNull.Value;
		}
		if (Pack.HasValue)
		{
			Adapter.InsertCommand.Parameters[5].Value = Pack.Value;
		}
		else
		{
			Adapter.InsertCommand.Parameters[5].Value = DBNull.Value;
		}
		Adapter.InsertCommand.Parameters[6].Value = FlagP;
		Adapter.InsertCommand.Parameters[7].Value = FlagA;
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

	[DebuggerNonUserCode]
	[DataObjectMethod(DataObjectMethodType.Update, true)]
	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	[HelpKeyword("vs.data.TableAdapter")]
	public virtual int Update(int? UnitID, string Amount, string Pamount, string Name, int? Punit, decimal? Pack, bool FlagP, bool FlagA, int? Original_UnitID, string Original_Amount, string Original_Pamount, string Original_Name, int? Original_Punit, decimal? Original_Pack, bool Original_FlagP, bool Original_FlagA)
	{
		if (UnitID.HasValue)
		{
			Adapter.UpdateCommand.Parameters[0].Value = UnitID.Value;
		}
		else
		{
			Adapter.UpdateCommand.Parameters[0].Value = DBNull.Value;
		}
		if (Amount == null)
		{
			Adapter.UpdateCommand.Parameters[1].Value = DBNull.Value;
		}
		else
		{
			Adapter.UpdateCommand.Parameters[1].Value = Amount;
		}
		if (Pamount == null)
		{
			Adapter.UpdateCommand.Parameters[2].Value = DBNull.Value;
		}
		else
		{
			Adapter.UpdateCommand.Parameters[2].Value = Pamount;
		}
		if (Name == null)
		{
			Adapter.UpdateCommand.Parameters[3].Value = DBNull.Value;
		}
		else
		{
			Adapter.UpdateCommand.Parameters[3].Value = Name;
		}
		if (Punit.HasValue)
		{
			Adapter.UpdateCommand.Parameters[4].Value = Punit.Value;
		}
		else
		{
			Adapter.UpdateCommand.Parameters[4].Value = DBNull.Value;
		}
		if (Pack.HasValue)
		{
			Adapter.UpdateCommand.Parameters[5].Value = Pack.Value;
		}
		else
		{
			Adapter.UpdateCommand.Parameters[5].Value = DBNull.Value;
		}
		Adapter.UpdateCommand.Parameters[6].Value = FlagP;
		Adapter.UpdateCommand.Parameters[7].Value = FlagA;
		if (Original_UnitID.HasValue)
		{
			Adapter.UpdateCommand.Parameters[8].Value = Original_UnitID.Value;
		}
		else
		{
			Adapter.UpdateCommand.Parameters[8].Value = DBNull.Value;
		}
		if (Original_Amount == null)
		{
			Adapter.UpdateCommand.Parameters[9].Value = 1;
			Adapter.UpdateCommand.Parameters[10].Value = DBNull.Value;
		}
		else
		{
			Adapter.UpdateCommand.Parameters[9].Value = 0;
			Adapter.UpdateCommand.Parameters[10].Value = Original_Amount;
		}
		if (Original_Pamount == null)
		{
			Adapter.UpdateCommand.Parameters[11].Value = 1;
			Adapter.UpdateCommand.Parameters[12].Value = DBNull.Value;
		}
		else
		{
			Adapter.UpdateCommand.Parameters[11].Value = 0;
			Adapter.UpdateCommand.Parameters[12].Value = Original_Pamount;
		}
		if (Original_Name == null)
		{
			Adapter.UpdateCommand.Parameters[13].Value = 1;
			Adapter.UpdateCommand.Parameters[14].Value = DBNull.Value;
		}
		else
		{
			Adapter.UpdateCommand.Parameters[13].Value = 0;
			Adapter.UpdateCommand.Parameters[14].Value = Original_Name;
		}
		if (Original_Punit.HasValue)
		{
			Adapter.UpdateCommand.Parameters[15].Value = 0;
			Adapter.UpdateCommand.Parameters[16].Value = Original_Punit.Value;
		}
		else
		{
			Adapter.UpdateCommand.Parameters[15].Value = 1;
			Adapter.UpdateCommand.Parameters[16].Value = DBNull.Value;
		}
		if (Original_Pack.HasValue)
		{
			Adapter.UpdateCommand.Parameters[17].Value = 0;
			Adapter.UpdateCommand.Parameters[18].Value = Original_Pack.Value;
		}
		else
		{
			Adapter.UpdateCommand.Parameters[17].Value = 1;
			Adapter.UpdateCommand.Parameters[18].Value = DBNull.Value;
		}
		Adapter.UpdateCommand.Parameters[19].Value = 0;
		Adapter.UpdateCommand.Parameters[20].Value = Original_FlagP;
		Adapter.UpdateCommand.Parameters[21].Value = 0;
		Adapter.UpdateCommand.Parameters[22].Value = Original_FlagA;
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

	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	[HelpKeyword("vs.data.TableAdapter")]
	[DataObjectMethod(DataObjectMethodType.Update, true)]
	[DebuggerNonUserCode]
	public virtual int Update(string Amount, string Pamount, string Name, int? Punit, decimal? Pack, bool FlagP, bool FlagA, int? Original_UnitID, string Original_Amount, string Original_Pamount, string Original_Name, int? Original_Punit, decimal? Original_Pack, bool Original_FlagP, bool Original_FlagA)
	{
		return Update(Original_UnitID, Amount, Pamount, Name, Punit, Pack, FlagP, FlagA, Original_UnitID, Original_Amount, Original_Pamount, Original_Name, Original_Punit, Original_Pack, Original_FlagP, Original_FlagA);
	}
}
