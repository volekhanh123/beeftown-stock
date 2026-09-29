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
[DataObject(true)]
[HelpKeyword("vs.data.TableAdapter")]
[DesignerCategory("code")]
[ToolboxItem(true)]
public class rPLUTableAdapter : Component
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

	[DebuggerNonUserCode]
	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	public rPLUTableAdapter()
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
		dataTableMapping.DataSetTable = "rPLU";
		dataTableMapping.ColumnMappings.Add("PLUID", "PLUID");
		dataTableMapping.ColumnMappings.Add("Valid", "Valid");
		dataTableMapping.ColumnMappings.Add("Remark", "Remark");
		dataTableMapping.ColumnMappings.Add("Index", "Index");
		dataTableMapping.ColumnMappings.Add("UnitID", "UnitID");
		dataTableMapping.ColumnMappings.Add("Price", "Price");
		dataTableMapping.ColumnMappings.Add("Cost", "Cost");
		dataTableMapping.ColumnMappings.Add("Tare", "Tare");
		dataTableMapping.ColumnMappings.Add("BarF1", "BarF1");
		dataTableMapping.ColumnMappings.Add("BarF2", "BarF2");
		dataTableMapping.ColumnMappings.Add("BarT1", "BarT1");
		dataTableMapping.ColumnMappings.Add("BarT2", "BarT2");
		dataTableMapping.ColumnMappings.Add("LabelID1", "LabelID1");
		dataTableMapping.ColumnMappings.Add("LabelID2", "LabelID2");
		dataTableMapping.ColumnMappings.Add("ClassID", "ClassID");
		dataTableMapping.ColumnMappings.Add("PS_SD", "PS_SD");
		dataTableMapping.ColumnMappings.Add("PS_ST", "PS_ST");
		dataTableMapping.ColumnMappings.Add("PS_PD", "PS_PD");
		dataTableMapping.ColumnMappings.Add("PS_PT", "PS_PT");
		dataTableMapping.ColumnMappings.Add("PS_UD", "PS_UD");
		dataTableMapping.ColumnMappings.Add("PC_SD", "PC_SD");
		dataTableMapping.ColumnMappings.Add("PC_ST", "PC_ST");
		dataTableMapping.ColumnMappings.Add("PC_PD", "PC_PD");
		dataTableMapping.ColumnMappings.Add("PC_PT", "PC_PT");
		dataTableMapping.ColumnMappings.Add("PC_UD", "PC_UD");
		dataTableMapping.ColumnMappings.Add("DF_U", "DF_U");
		dataTableMapping.ColumnMappings.Add("DF_D", "DF_D");
		dataTableMapping.ColumnMappings.Add("DF_UN", "DF_UN");
		dataTableMapping.ColumnMappings.Add("DF_DN", "DF_DN");
		dataTableMapping.ColumnMappings.Add("DA_Sort1", "DA_Sort1");
		dataTableMapping.ColumnMappings.Add("DA_Day1", "DA_Day1");
		dataTableMapping.ColumnMappings.Add("DA_Up1", "DA_Up1");
		dataTableMapping.ColumnMappings.Add("DA_Dn1", "DA_Dn1");
		dataTableMapping.ColumnMappings.Add("DA_Num1", "DA_Num1");
		dataTableMapping.ColumnMappings.Add("DA_Sort2", "DA_Sort2");
		dataTableMapping.ColumnMappings.Add("DA_Day2", "DA_Day2");
		dataTableMapping.ColumnMappings.Add("DA_Up2", "DA_Up2");
		dataTableMapping.ColumnMappings.Add("DA_Dn2", "DA_Dn2");
		dataTableMapping.ColumnMappings.Add("DA_Num2", "DA_Num2");
		dataTableMapping.ColumnMappings.Add("DA_Sort3", "DA_Sort3");
		dataTableMapping.ColumnMappings.Add("DA_Day3", "DA_Day3");
		dataTableMapping.ColumnMappings.Add("DA_Up3", "DA_Up3");
		dataTableMapping.ColumnMappings.Add("DA_Dn3", "DA_Dn3");
		dataTableMapping.ColumnMappings.Add("DA_Num3", "DA_Num3");
		dataTableMapping.ColumnMappings.Add("DA_Sort4", "DA_Sort4");
		dataTableMapping.ColumnMappings.Add("DA_Day4", "DA_Day4");
		dataTableMapping.ColumnMappings.Add("DA_Up4", "DA_Up4");
		dataTableMapping.ColumnMappings.Add("DA_Dn4", "DA_Dn4");
		dataTableMapping.ColumnMappings.Add("DA_Num4", "DA_Num4");
		dataTableMapping.ColumnMappings.Add("Name", "Name");
		dataTableMapping.ColumnMappings.Add("Text1", "Text1");
		dataTableMapping.ColumnMappings.Add("Text2", "Text2");
		dataTableMapping.ColumnMappings.Add("Text3", "Text3");
		dataTableMapping.ColumnMappings.Add("Text4", "Text4");
		dataTableMapping.ColumnMappings.Add("Text5", "Text5");
		dataTableMapping.ColumnMappings.Add("Text6", "Text6");
		dataTableMapping.ColumnMappings.Add("Text7", "Text7");
		dataTableMapping.ColumnMappings.Add("TaxType", "TaxType");
		dataTableMapping.ColumnMappings.Add("Tax", "Tax");
		dataTableMapping.ColumnMappings.Add("SspValue1", "SspValue1");
		dataTableMapping.ColumnMappings.Add("SspValue2", "SspValue2");
		dataTableMapping.ColumnMappings.Add("SspValue3", "SspValue3");
		dataTableMapping.ColumnMappings.Add("SspValue4", "SspValue4");
		dataTableMapping.ColumnMappings.Add("SType", "SType");
		_adapter.TableMappings.Add(dataTableMapping);
		_adapter.DeleteCommand = new OleDbCommand();
		_adapter.DeleteCommand.Connection = Connection;
		_adapter.DeleteCommand.CommandText = "DELETE FROM `rPLU` WHERE ((`PLUID` = ?) AND ((? = 1 AND `Valid` IS NULL) OR (`Valid` = ?)) AND ((? = 1 AND `Remark` IS NULL) OR (`Remark` = ?)) AND ((? = 1 AND `Index` IS NULL) OR (`Index` = ?)) AND ((? = 1 AND `UnitID` IS NULL) OR (`UnitID` = ?)) AND ((? = 1 AND `Price` IS NULL) OR (`Price` = ?)) AND ((? = 1 AND `Cost` IS NULL) OR (`Cost` = ?)) AND ((? = 1 AND `Tare` IS NULL) OR (`Tare` = ?)) AND ((? = 1 AND `BarF1` IS NULL) OR (`BarF1` = ?)) AND ((? = 1 AND `BarF2` IS NULL) OR (`BarF2` = ?)) AND ((? = 1 AND `BarT1` IS NULL) OR (`BarT1` = ?)) AND ((? = 1 AND `BarT2` IS NULL) OR (`BarT2` = ?)) AND ((? = 1 AND `LabelID1` IS NULL) OR (`LabelID1` = ?)) AND ((? = 1 AND `LabelID2` IS NULL) OR (`LabelID2` = ?)) AND ((? = 1 AND `ClassID` IS NULL) OR (`ClassID` = ?)) AND ((? = 1 AND `PS_SD` IS NULL) OR (`PS_SD` = ?)) AND ((? = 1 AND `PS_ST` IS NULL) OR (`PS_ST` = ?)) AND ((? = 1 AND `PS_PD` IS NULL) OR (`PS_PD` = ?)) AND ((? = 1 AND `PS_PT` IS NULL) OR (`PS_PT` = ?)) AND ((? = 1 AND `PS_UD` IS NULL) OR (`PS_UD` = ?)) AND ((? = 1 AND `PC_SD` IS NULL) OR (`PC_SD` = ?)) AND ((? = 1 AND `PC_ST` IS NULL) OR (`PC_ST` = ?)) AND ((? = 1 AND `PC_PD` IS NULL) OR (`PC_PD` = ?)) AND ((? = 1 AND `PC_PT` IS NULL) OR (`PC_PT` = ?)) AND ((? = 1 AND `PC_UD` IS NULL) OR (`PC_UD` = ?)) AND ((? = 1 AND `DF_U` IS NULL) OR (`DF_U` = ?)) AND ((? = 1 AND `DF_D` IS NULL) OR (`DF_D` = ?)) AND ((? = 1 AND `DF_UN` IS NULL) OR (`DF_UN` = ?)) AND ((? = 1 AND `DF_DN` IS NULL) OR (`DF_DN` = ?)) AND ((? = 1 AND `DA_Sort1` IS NULL) OR (`DA_Sort1` = ?)) AND ((? = 1 AND `DA_Day1` IS NULL) OR (`DA_Day1` = ?)) AND ((? = 1 AND `DA_Up1` IS NULL) OR (`DA_Up1` = ?)) AND ((? = 1 AND `DA_Dn1` IS NULL) OR (`DA_Dn1` = ?)) AND ((? = 1 AND `DA_Num1` IS NULL) OR (`DA_Num1` = ?)) AND ((? = 1 AND `DA_Sort2` IS NULL) OR (`DA_Sort2` = ?)) AND ((? = 1 AND `DA_Day2` IS NULL) OR (`DA_Day2` = ?)) AND ((? = 1 AND `DA_Up2` IS NULL) OR (`DA_Up2` = ?)) AND ((? = 1 AND `DA_Dn2` IS NULL) OR (`DA_Dn2` = ?)) AND ((? = 1 AND `DA_Num2` IS NULL) OR (`DA_Num2` = ?)) AND ((? = 1 AND `DA_Sort3` IS NULL) OR (`DA_Sort3` = ?)) AND ((? = 1 AND `DA_Day3` IS NULL) OR (`DA_Day3` = ?)) AND ((? = 1 AND `DA_Up3` IS NULL) OR (`DA_Up3` = ?)) AND ((? = 1 AND `DA_Dn3` IS NULL) OR (`DA_Dn3` = ?)) AND ((? = 1 AND `DA_Num3` IS NULL) OR (`DA_Num3` = ?)) AND ((? = 1 AND `DA_Sort4` IS NULL) OR (`DA_Sort4` = ?)) AND ((? = 1 AND `DA_Day4` IS NULL) OR (`DA_Day4` = ?)) AND ((? = 1 AND `DA_Up4` IS NULL) OR (`DA_Up4` = ?)) AND ((? = 1 AND `DA_Dn4` IS NULL) OR (`DA_Dn4` = ?)) AND ((? = 1 AND `DA_Num4` IS NULL) OR (`DA_Num4` = ?)) AND ((? = 1 AND `Name` IS NULL) OR (`Name` = ?)) AND ((? = 1 AND `Text1` IS NULL) OR (`Text1` = ?)) AND ((? = 1 AND `Text2` IS NULL) OR (`Text2` = ?)) AND ((? = 1 AND `Text3` IS NULL) OR (`Text3` = ?)) AND ((? = 1 AND `Text4` IS NULL) OR (`Text4` = ?)) AND ((? = 1 AND `Text5` IS NULL) OR (`Text5` = ?)) AND ((? = 1 AND `Text6` IS NULL) OR (`Text6` = ?)) AND ((? = 1 AND `Text7` IS NULL) OR (`Text7` = ?)) AND ((? = 1 AND `TaxType` IS NULL) OR (`TaxType` = ?)) AND ((? = 1 AND `Tax` IS NULL) OR (`Tax` = ?)) AND ((? = 1 AND `SspValue1` IS NULL) OR (`SspValue1` = ?)) AND ((? = 1 AND `SspValue2` IS NULL) OR (`SspValue2` = ?)) AND ((? = 1 AND `SspValue3` IS NULL) OR (`SspValue3` = ?)) AND ((? = 1 AND `SspValue4` IS NULL) OR (`SspValue4` = ?)) AND ((? = 1 AND `SType` IS NULL) OR (`SType` = ?)))";
		_adapter.DeleteCommand.CommandType = CommandType.Text;
		_adapter.DeleteCommand.Parameters.Add(new OleDbParameter("Original_PLUID", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "PLUID", DataRowVersion.Original, sourceColumnNullMapping: false, null));
		_adapter.DeleteCommand.Parameters.Add(new OleDbParameter("IsNull_Valid", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "Valid", DataRowVersion.Original, sourceColumnNullMapping: true, null));
		_adapter.DeleteCommand.Parameters.Add(new OleDbParameter("Original_Valid", OleDbType.Boolean, 0, ParameterDirection.Input, 0, 0, "Valid", DataRowVersion.Original, sourceColumnNullMapping: false, null));
		_adapter.DeleteCommand.Parameters.Add(new OleDbParameter("IsNull_Remark", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "Remark", DataRowVersion.Original, sourceColumnNullMapping: true, null));
		_adapter.DeleteCommand.Parameters.Add(new OleDbParameter("Original_Remark", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "Remark", DataRowVersion.Original, sourceColumnNullMapping: false, null));
		_adapter.DeleteCommand.Parameters.Add(new OleDbParameter("IsNull_Index", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "Index", DataRowVersion.Original, sourceColumnNullMapping: true, null));
		_adapter.DeleteCommand.Parameters.Add(new OleDbParameter("Original_Index", OleDbType.VarWChar, 0, ParameterDirection.Input, 0, 0, "Index", DataRowVersion.Original, sourceColumnNullMapping: false, null));
		_adapter.DeleteCommand.Parameters.Add(new OleDbParameter("IsNull_UnitID", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "UnitID", DataRowVersion.Original, sourceColumnNullMapping: true, null));
		_adapter.DeleteCommand.Parameters.Add(new OleDbParameter("Original_UnitID", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "UnitID", DataRowVersion.Original, sourceColumnNullMapping: false, null));
		_adapter.DeleteCommand.Parameters.Add(new OleDbParameter("IsNull_Price", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "Price", DataRowVersion.Original, sourceColumnNullMapping: true, null));
		_adapter.DeleteCommand.Parameters.Add(new OleDbParameter("Original_Price", OleDbType.Currency, 0, ParameterDirection.Input, 0, 0, "Price", DataRowVersion.Original, sourceColumnNullMapping: false, null));
		_adapter.DeleteCommand.Parameters.Add(new OleDbParameter("IsNull_Cost", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "Cost", DataRowVersion.Original, sourceColumnNullMapping: true, null));
		_adapter.DeleteCommand.Parameters.Add(new OleDbParameter("Original_Cost", OleDbType.Currency, 0, ParameterDirection.Input, 0, 0, "Cost", DataRowVersion.Original, sourceColumnNullMapping: false, null));
		_adapter.DeleteCommand.Parameters.Add(new OleDbParameter("IsNull_Tare", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "Tare", DataRowVersion.Original, sourceColumnNullMapping: true, null));
		_adapter.DeleteCommand.Parameters.Add(new OleDbParameter("Original_Tare", OleDbType.Currency, 0, ParameterDirection.Input, 0, 0, "Tare", DataRowVersion.Original, sourceColumnNullMapping: false, null));
		_adapter.DeleteCommand.Parameters.Add(new OleDbParameter("IsNull_BarF1", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "BarF1", DataRowVersion.Original, sourceColumnNullMapping: true, null));
		_adapter.DeleteCommand.Parameters.Add(new OleDbParameter("Original_BarF1", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "BarF1", DataRowVersion.Original, sourceColumnNullMapping: false, null));
		_adapter.DeleteCommand.Parameters.Add(new OleDbParameter("IsNull_BarF2", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "BarF2", DataRowVersion.Original, sourceColumnNullMapping: true, null));
		_adapter.DeleteCommand.Parameters.Add(new OleDbParameter("Original_BarF2", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "BarF2", DataRowVersion.Original, sourceColumnNullMapping: false, null));
		_adapter.DeleteCommand.Parameters.Add(new OleDbParameter("IsNull_BarT1", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "BarT1", DataRowVersion.Original, sourceColumnNullMapping: true, null));
		_adapter.DeleteCommand.Parameters.Add(new OleDbParameter("Original_BarT1", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "BarT1", DataRowVersion.Original, sourceColumnNullMapping: false, null));
		_adapter.DeleteCommand.Parameters.Add(new OleDbParameter("IsNull_BarT2", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "BarT2", DataRowVersion.Original, sourceColumnNullMapping: true, null));
		_adapter.DeleteCommand.Parameters.Add(new OleDbParameter("Original_BarT2", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "BarT2", DataRowVersion.Original, sourceColumnNullMapping: false, null));
		_adapter.DeleteCommand.Parameters.Add(new OleDbParameter("IsNull_LabelID1", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "LabelID1", DataRowVersion.Original, sourceColumnNullMapping: true, null));
		_adapter.DeleteCommand.Parameters.Add(new OleDbParameter("Original_LabelID1", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "LabelID1", DataRowVersion.Original, sourceColumnNullMapping: false, null));
		_adapter.DeleteCommand.Parameters.Add(new OleDbParameter("IsNull_LabelID2", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "LabelID2", DataRowVersion.Original, sourceColumnNullMapping: true, null));
		_adapter.DeleteCommand.Parameters.Add(new OleDbParameter("Original_LabelID2", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "LabelID2", DataRowVersion.Original, sourceColumnNullMapping: false, null));
		_adapter.DeleteCommand.Parameters.Add(new OleDbParameter("IsNull_ClassID", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "ClassID", DataRowVersion.Original, sourceColumnNullMapping: true, null));
		_adapter.DeleteCommand.Parameters.Add(new OleDbParameter("Original_ClassID", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "ClassID", DataRowVersion.Original, sourceColumnNullMapping: false, null));
		_adapter.DeleteCommand.Parameters.Add(new OleDbParameter("IsNull_PS_SD", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "PS_SD", DataRowVersion.Original, sourceColumnNullMapping: true, null));
		_adapter.DeleteCommand.Parameters.Add(new OleDbParameter("Original_PS_SD", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "PS_SD", DataRowVersion.Original, sourceColumnNullMapping: false, null));
		_adapter.DeleteCommand.Parameters.Add(new OleDbParameter("IsNull_PS_ST", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "PS_ST", DataRowVersion.Original, sourceColumnNullMapping: true, null));
		_adapter.DeleteCommand.Parameters.Add(new OleDbParameter("Original_PS_ST", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "PS_ST", DataRowVersion.Original, sourceColumnNullMapping: false, null));
		_adapter.DeleteCommand.Parameters.Add(new OleDbParameter("IsNull_PS_PD", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "PS_PD", DataRowVersion.Original, sourceColumnNullMapping: true, null));
		_adapter.DeleteCommand.Parameters.Add(new OleDbParameter("Original_PS_PD", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "PS_PD", DataRowVersion.Original, sourceColumnNullMapping: false, null));
		_adapter.DeleteCommand.Parameters.Add(new OleDbParameter("IsNull_PS_PT", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "PS_PT", DataRowVersion.Original, sourceColumnNullMapping: true, null));
		_adapter.DeleteCommand.Parameters.Add(new OleDbParameter("Original_PS_PT", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "PS_PT", DataRowVersion.Original, sourceColumnNullMapping: false, null));
		_adapter.DeleteCommand.Parameters.Add(new OleDbParameter("IsNull_PS_UD", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "PS_UD", DataRowVersion.Original, sourceColumnNullMapping: true, null));
		_adapter.DeleteCommand.Parameters.Add(new OleDbParameter("Original_PS_UD", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "PS_UD", DataRowVersion.Original, sourceColumnNullMapping: false, null));
		_adapter.DeleteCommand.Parameters.Add(new OleDbParameter("IsNull_PC_SD", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "PC_SD", DataRowVersion.Original, sourceColumnNullMapping: true, null));
		_adapter.DeleteCommand.Parameters.Add(new OleDbParameter("Original_PC_SD", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "PC_SD", DataRowVersion.Original, sourceColumnNullMapping: false, null));
		_adapter.DeleteCommand.Parameters.Add(new OleDbParameter("IsNull_PC_ST", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "PC_ST", DataRowVersion.Original, sourceColumnNullMapping: true, null));
		_adapter.DeleteCommand.Parameters.Add(new OleDbParameter("Original_PC_ST", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "PC_ST", DataRowVersion.Original, sourceColumnNullMapping: false, null));
		_adapter.DeleteCommand.Parameters.Add(new OleDbParameter("IsNull_PC_PD", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "PC_PD", DataRowVersion.Original, sourceColumnNullMapping: true, null));
		_adapter.DeleteCommand.Parameters.Add(new OleDbParameter("Original_PC_PD", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "PC_PD", DataRowVersion.Original, sourceColumnNullMapping: false, null));
		_adapter.DeleteCommand.Parameters.Add(new OleDbParameter("IsNull_PC_PT", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "PC_PT", DataRowVersion.Original, sourceColumnNullMapping: true, null));
		_adapter.DeleteCommand.Parameters.Add(new OleDbParameter("Original_PC_PT", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "PC_PT", DataRowVersion.Original, sourceColumnNullMapping: false, null));
		_adapter.DeleteCommand.Parameters.Add(new OleDbParameter("IsNull_PC_UD", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "PC_UD", DataRowVersion.Original, sourceColumnNullMapping: true, null));
		_adapter.DeleteCommand.Parameters.Add(new OleDbParameter("Original_PC_UD", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "PC_UD", DataRowVersion.Original, sourceColumnNullMapping: false, null));
		_adapter.DeleteCommand.Parameters.Add(new OleDbParameter("IsNull_DF_U", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "DF_U", DataRowVersion.Original, sourceColumnNullMapping: true, null));
		_adapter.DeleteCommand.Parameters.Add(new OleDbParameter("Original_DF_U", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "DF_U", DataRowVersion.Original, sourceColumnNullMapping: false, null));
		_adapter.DeleteCommand.Parameters.Add(new OleDbParameter("IsNull_DF_D", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "DF_D", DataRowVersion.Original, sourceColumnNullMapping: true, null));
		_adapter.DeleteCommand.Parameters.Add(new OleDbParameter("Original_DF_D", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "DF_D", DataRowVersion.Original, sourceColumnNullMapping: false, null));
		_adapter.DeleteCommand.Parameters.Add(new OleDbParameter("IsNull_DF_UN", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "DF_UN", DataRowVersion.Original, sourceColumnNullMapping: true, null));
		_adapter.DeleteCommand.Parameters.Add(new OleDbParameter("Original_DF_UN", OleDbType.Currency, 0, ParameterDirection.Input, 0, 0, "DF_UN", DataRowVersion.Original, sourceColumnNullMapping: false, null));
		_adapter.DeleteCommand.Parameters.Add(new OleDbParameter("IsNull_DF_DN", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "DF_DN", DataRowVersion.Original, sourceColumnNullMapping: true, null));
		_adapter.DeleteCommand.Parameters.Add(new OleDbParameter("Original_DF_DN", OleDbType.Currency, 0, ParameterDirection.Input, 0, 0, "DF_DN", DataRowVersion.Original, sourceColumnNullMapping: false, null));
		_adapter.DeleteCommand.Parameters.Add(new OleDbParameter("IsNull_DA_Sort1", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "DA_Sort1", DataRowVersion.Original, sourceColumnNullMapping: true, null));
		_adapter.DeleteCommand.Parameters.Add(new OleDbParameter("Original_DA_Sort1", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "DA_Sort1", DataRowVersion.Original, sourceColumnNullMapping: false, null));
		_adapter.DeleteCommand.Parameters.Add(new OleDbParameter("IsNull_DA_Day1", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "DA_Day1", DataRowVersion.Original, sourceColumnNullMapping: true, null));
		_adapter.DeleteCommand.Parameters.Add(new OleDbParameter("Original_DA_Day1", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "DA_Day1", DataRowVersion.Original, sourceColumnNullMapping: false, null));
		_adapter.DeleteCommand.Parameters.Add(new OleDbParameter("IsNull_DA_Up1", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "DA_Up1", DataRowVersion.Original, sourceColumnNullMapping: true, null));
		_adapter.DeleteCommand.Parameters.Add(new OleDbParameter("Original_DA_Up1", OleDbType.Currency, 0, ParameterDirection.Input, 0, 0, "DA_Up1", DataRowVersion.Original, sourceColumnNullMapping: false, null));
		_adapter.DeleteCommand.Parameters.Add(new OleDbParameter("IsNull_DA_Dn1", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "DA_Dn1", DataRowVersion.Original, sourceColumnNullMapping: true, null));
		_adapter.DeleteCommand.Parameters.Add(new OleDbParameter("Original_DA_Dn1", OleDbType.Currency, 0, ParameterDirection.Input, 0, 0, "DA_Dn1", DataRowVersion.Original, sourceColumnNullMapping: false, null));
		_adapter.DeleteCommand.Parameters.Add(new OleDbParameter("IsNull_DA_Num1", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "DA_Num1", DataRowVersion.Original, sourceColumnNullMapping: true, null));
		_adapter.DeleteCommand.Parameters.Add(new OleDbParameter("Original_DA_Num1", OleDbType.Currency, 0, ParameterDirection.Input, 0, 0, "DA_Num1", DataRowVersion.Original, sourceColumnNullMapping: false, null));
		_adapter.DeleteCommand.Parameters.Add(new OleDbParameter("IsNull_DA_Sort2", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "DA_Sort2", DataRowVersion.Original, sourceColumnNullMapping: true, null));
		_adapter.DeleteCommand.Parameters.Add(new OleDbParameter("Original_DA_Sort2", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "DA_Sort2", DataRowVersion.Original, sourceColumnNullMapping: false, null));
		_adapter.DeleteCommand.Parameters.Add(new OleDbParameter("IsNull_DA_Day2", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "DA_Day2", DataRowVersion.Original, sourceColumnNullMapping: true, null));
		_adapter.DeleteCommand.Parameters.Add(new OleDbParameter("Original_DA_Day2", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "DA_Day2", DataRowVersion.Original, sourceColumnNullMapping: false, null));
		_adapter.DeleteCommand.Parameters.Add(new OleDbParameter("IsNull_DA_Up2", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "DA_Up2", DataRowVersion.Original, sourceColumnNullMapping: true, null));
		_adapter.DeleteCommand.Parameters.Add(new OleDbParameter("Original_DA_Up2", OleDbType.Currency, 0, ParameterDirection.Input, 0, 0, "DA_Up2", DataRowVersion.Original, sourceColumnNullMapping: false, null));
		_adapter.DeleteCommand.Parameters.Add(new OleDbParameter("IsNull_DA_Dn2", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "DA_Dn2", DataRowVersion.Original, sourceColumnNullMapping: true, null));
		_adapter.DeleteCommand.Parameters.Add(new OleDbParameter("Original_DA_Dn2", OleDbType.Currency, 0, ParameterDirection.Input, 0, 0, "DA_Dn2", DataRowVersion.Original, sourceColumnNullMapping: false, null));
		_adapter.DeleteCommand.Parameters.Add(new OleDbParameter("IsNull_DA_Num2", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "DA_Num2", DataRowVersion.Original, sourceColumnNullMapping: true, null));
		_adapter.DeleteCommand.Parameters.Add(new OleDbParameter("Original_DA_Num2", OleDbType.Currency, 0, ParameterDirection.Input, 0, 0, "DA_Num2", DataRowVersion.Original, sourceColumnNullMapping: false, null));
		_adapter.DeleteCommand.Parameters.Add(new OleDbParameter("IsNull_DA_Sort3", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "DA_Sort3", DataRowVersion.Original, sourceColumnNullMapping: true, null));
		_adapter.DeleteCommand.Parameters.Add(new OleDbParameter("Original_DA_Sort3", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "DA_Sort3", DataRowVersion.Original, sourceColumnNullMapping: false, null));
		_adapter.DeleteCommand.Parameters.Add(new OleDbParameter("IsNull_DA_Day3", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "DA_Day3", DataRowVersion.Original, sourceColumnNullMapping: true, null));
		_adapter.DeleteCommand.Parameters.Add(new OleDbParameter("Original_DA_Day3", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "DA_Day3", DataRowVersion.Original, sourceColumnNullMapping: false, null));
		_adapter.DeleteCommand.Parameters.Add(new OleDbParameter("IsNull_DA_Up3", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "DA_Up3", DataRowVersion.Original, sourceColumnNullMapping: true, null));
		_adapter.DeleteCommand.Parameters.Add(new OleDbParameter("Original_DA_Up3", OleDbType.Currency, 0, ParameterDirection.Input, 0, 0, "DA_Up3", DataRowVersion.Original, sourceColumnNullMapping: false, null));
		_adapter.DeleteCommand.Parameters.Add(new OleDbParameter("IsNull_DA_Dn3", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "DA_Dn3", DataRowVersion.Original, sourceColumnNullMapping: true, null));
		_adapter.DeleteCommand.Parameters.Add(new OleDbParameter("Original_DA_Dn3", OleDbType.Currency, 0, ParameterDirection.Input, 0, 0, "DA_Dn3", DataRowVersion.Original, sourceColumnNullMapping: false, null));
		_adapter.DeleteCommand.Parameters.Add(new OleDbParameter("IsNull_DA_Num3", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "DA_Num3", DataRowVersion.Original, sourceColumnNullMapping: true, null));
		_adapter.DeleteCommand.Parameters.Add(new OleDbParameter("Original_DA_Num3", OleDbType.Currency, 0, ParameterDirection.Input, 0, 0, "DA_Num3", DataRowVersion.Original, sourceColumnNullMapping: false, null));
		_adapter.DeleteCommand.Parameters.Add(new OleDbParameter("IsNull_DA_Sort4", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "DA_Sort4", DataRowVersion.Original, sourceColumnNullMapping: true, null));
		_adapter.DeleteCommand.Parameters.Add(new OleDbParameter("Original_DA_Sort4", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "DA_Sort4", DataRowVersion.Original, sourceColumnNullMapping: false, null));
		_adapter.DeleteCommand.Parameters.Add(new OleDbParameter("IsNull_DA_Day4", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "DA_Day4", DataRowVersion.Original, sourceColumnNullMapping: true, null));
		_adapter.DeleteCommand.Parameters.Add(new OleDbParameter("Original_DA_Day4", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "DA_Day4", DataRowVersion.Original, sourceColumnNullMapping: false, null));
		_adapter.DeleteCommand.Parameters.Add(new OleDbParameter("IsNull_DA_Up4", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "DA_Up4", DataRowVersion.Original, sourceColumnNullMapping: true, null));
		_adapter.DeleteCommand.Parameters.Add(new OleDbParameter("Original_DA_Up4", OleDbType.Currency, 0, ParameterDirection.Input, 0, 0, "DA_Up4", DataRowVersion.Original, sourceColumnNullMapping: false, null));
		_adapter.DeleteCommand.Parameters.Add(new OleDbParameter("IsNull_DA_Dn4", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "DA_Dn4", DataRowVersion.Original, sourceColumnNullMapping: true, null));
		_adapter.DeleteCommand.Parameters.Add(new OleDbParameter("Original_DA_Dn4", OleDbType.Currency, 0, ParameterDirection.Input, 0, 0, "DA_Dn4", DataRowVersion.Original, sourceColumnNullMapping: false, null));
		_adapter.DeleteCommand.Parameters.Add(new OleDbParameter("IsNull_DA_Num4", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "DA_Num4", DataRowVersion.Original, sourceColumnNullMapping: true, null));
		_adapter.DeleteCommand.Parameters.Add(new OleDbParameter("Original_DA_Num4", OleDbType.Currency, 0, ParameterDirection.Input, 0, 0, "DA_Num4", DataRowVersion.Original, sourceColumnNullMapping: false, null));
		_adapter.DeleteCommand.Parameters.Add(new OleDbParameter("IsNull_Name", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "Name", DataRowVersion.Original, sourceColumnNullMapping: true, null));
		_adapter.DeleteCommand.Parameters.Add(new OleDbParameter("Original_Name", OleDbType.VarWChar, 0, ParameterDirection.Input, 0, 0, "Name", DataRowVersion.Original, sourceColumnNullMapping: false, null));
		_adapter.DeleteCommand.Parameters.Add(new OleDbParameter("IsNull_Text1", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "Text1", DataRowVersion.Original, sourceColumnNullMapping: true, null));
		_adapter.DeleteCommand.Parameters.Add(new OleDbParameter("Original_Text1", OleDbType.VarWChar, 0, ParameterDirection.Input, 0, 0, "Text1", DataRowVersion.Original, sourceColumnNullMapping: false, null));
		_adapter.DeleteCommand.Parameters.Add(new OleDbParameter("IsNull_Text2", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "Text2", DataRowVersion.Original, sourceColumnNullMapping: true, null));
		_adapter.DeleteCommand.Parameters.Add(new OleDbParameter("Original_Text2", OleDbType.VarWChar, 0, ParameterDirection.Input, 0, 0, "Text2", DataRowVersion.Original, sourceColumnNullMapping: false, null));
		_adapter.DeleteCommand.Parameters.Add(new OleDbParameter("IsNull_Text3", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "Text3", DataRowVersion.Original, sourceColumnNullMapping: true, null));
		_adapter.DeleteCommand.Parameters.Add(new OleDbParameter("Original_Text3", OleDbType.VarWChar, 0, ParameterDirection.Input, 0, 0, "Text3", DataRowVersion.Original, sourceColumnNullMapping: false, null));
		_adapter.DeleteCommand.Parameters.Add(new OleDbParameter("IsNull_Text4", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "Text4", DataRowVersion.Original, sourceColumnNullMapping: true, null));
		_adapter.DeleteCommand.Parameters.Add(new OleDbParameter("Original_Text4", OleDbType.VarWChar, 0, ParameterDirection.Input, 0, 0, "Text4", DataRowVersion.Original, sourceColumnNullMapping: false, null));
		_adapter.DeleteCommand.Parameters.Add(new OleDbParameter("IsNull_Text5", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "Text5", DataRowVersion.Original, sourceColumnNullMapping: true, null));
		_adapter.DeleteCommand.Parameters.Add(new OleDbParameter("Original_Text5", OleDbType.VarWChar, 0, ParameterDirection.Input, 0, 0, "Text5", DataRowVersion.Original, sourceColumnNullMapping: false, null));
		_adapter.DeleteCommand.Parameters.Add(new OleDbParameter("IsNull_Text6", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "Text6", DataRowVersion.Original, sourceColumnNullMapping: true, null));
		_adapter.DeleteCommand.Parameters.Add(new OleDbParameter("Original_Text6", OleDbType.VarWChar, 0, ParameterDirection.Input, 0, 0, "Text6", DataRowVersion.Original, sourceColumnNullMapping: false, null));
		_adapter.DeleteCommand.Parameters.Add(new OleDbParameter("IsNull_Text7", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "Text7", DataRowVersion.Original, sourceColumnNullMapping: true, null));
		_adapter.DeleteCommand.Parameters.Add(new OleDbParameter("Original_Text7", OleDbType.VarWChar, 0, ParameterDirection.Input, 0, 0, "Text7", DataRowVersion.Original, sourceColumnNullMapping: false, null));
		_adapter.DeleteCommand.Parameters.Add(new OleDbParameter("IsNull_TaxType", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "TaxType", DataRowVersion.Original, sourceColumnNullMapping: true, null));
		_adapter.DeleteCommand.Parameters.Add(new OleDbParameter("Original_TaxType", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "TaxType", DataRowVersion.Original, sourceColumnNullMapping: false, null));
		_adapter.DeleteCommand.Parameters.Add(new OleDbParameter("IsNull_Tax", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "Tax", DataRowVersion.Original, sourceColumnNullMapping: true, null));
		_adapter.DeleteCommand.Parameters.Add(new OleDbParameter("Original_Tax", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "Tax", DataRowVersion.Original, sourceColumnNullMapping: false, null));
		_adapter.DeleteCommand.Parameters.Add(new OleDbParameter("IsNull_SspValue1", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "SspValue1", DataRowVersion.Original, sourceColumnNullMapping: true, null));
		_adapter.DeleteCommand.Parameters.Add(new OleDbParameter("Original_SspValue1", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "SspValue1", DataRowVersion.Original, sourceColumnNullMapping: false, null));
		_adapter.DeleteCommand.Parameters.Add(new OleDbParameter("IsNull_SspValue2", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "SspValue2", DataRowVersion.Original, sourceColumnNullMapping: true, null));
		_adapter.DeleteCommand.Parameters.Add(new OleDbParameter("Original_SspValue2", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "SspValue2", DataRowVersion.Original, sourceColumnNullMapping: false, null));
		_adapter.DeleteCommand.Parameters.Add(new OleDbParameter("IsNull_SspValue3", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "SspValue3", DataRowVersion.Original, sourceColumnNullMapping: true, null));
		_adapter.DeleteCommand.Parameters.Add(new OleDbParameter("Original_SspValue3", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "SspValue3", DataRowVersion.Original, sourceColumnNullMapping: false, null));
		_adapter.DeleteCommand.Parameters.Add(new OleDbParameter("IsNull_SspValue4", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "SspValue4", DataRowVersion.Original, sourceColumnNullMapping: true, null));
		_adapter.DeleteCommand.Parameters.Add(new OleDbParameter("Original_SspValue4", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "SspValue4", DataRowVersion.Original, sourceColumnNullMapping: false, null));
		_adapter.DeleteCommand.Parameters.Add(new OleDbParameter("IsNull_SType", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "SType", DataRowVersion.Original, sourceColumnNullMapping: true, null));
		_adapter.DeleteCommand.Parameters.Add(new OleDbParameter("Original_SType", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "SType", DataRowVersion.Original, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand = new OleDbCommand();
		_adapter.InsertCommand.Connection = Connection;
		_adapter.InsertCommand.CommandText = "INSERT INTO `rPLU` (`PLUID`, `Valid`, `Remark`, `Index`, `UnitID`, `Price`, `Cost`, `Tare`, `BarF1`, `BarF2`, `BarT1`, `BarT2`, `LabelID1`, `LabelID2`, `ClassID`, `PS_SD`, `PS_ST`, `PS_PD`, `PS_PT`, `PS_UD`, `PC_SD`, `PC_ST`, `PC_PD`, `PC_PT`, `PC_UD`, `DF_U`, `DF_D`, `DF_UN`, `DF_DN`, `DA_Sort1`, `DA_Day1`, `DA_Up1`, `DA_Dn1`, `DA_Num1`, `DA_Sort2`, `DA_Day2`, `DA_Up2`, `DA_Dn2`, `DA_Num2`, `DA_Sort3`, `DA_Day3`, `DA_Up3`, `DA_Dn3`, `DA_Num3`, `DA_Sort4`, `DA_Day4`, `DA_Up4`, `DA_Dn4`, `DA_Num4`, `Name`, `Text1`, `Text2`, `Text3`, `Text4`, `Text5`, `Text6`, `Text7`, `TaxType`, `Tax`, `SspValue1`, `SspValue2`, `SspValue3`, `SspValue4`, `SType`) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
		_adapter.InsertCommand.CommandType = CommandType.Text;
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("PLUID", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "PLUID", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("Valid", OleDbType.Boolean, 0, ParameterDirection.Input, 0, 0, "Valid", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("Remark", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "Remark", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("Index", OleDbType.VarWChar, 0, ParameterDirection.Input, 0, 0, "Index", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("UnitID", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "UnitID", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("Price", OleDbType.Currency, 0, ParameterDirection.Input, 0, 0, "Price", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("Cost", OleDbType.Currency, 0, ParameterDirection.Input, 0, 0, "Cost", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("Tare", OleDbType.Currency, 0, ParameterDirection.Input, 0, 0, "Tare", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("BarF1", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "BarF1", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("BarF2", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "BarF2", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("BarT1", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "BarT1", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("BarT2", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "BarT2", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("LabelID1", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "LabelID1", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("LabelID2", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "LabelID2", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("ClassID", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "ClassID", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("PS_SD", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "PS_SD", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("PS_ST", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "PS_ST", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("PS_PD", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "PS_PD", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("PS_PT", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "PS_PT", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("PS_UD", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "PS_UD", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("PC_SD", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "PC_SD", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("PC_ST", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "PC_ST", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("PC_PD", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "PC_PD", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("PC_PT", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "PC_PT", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("PC_UD", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "PC_UD", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("DF_U", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "DF_U", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("DF_D", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "DF_D", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("DF_UN", OleDbType.Currency, 0, ParameterDirection.Input, 0, 0, "DF_UN", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("DF_DN", OleDbType.Currency, 0, ParameterDirection.Input, 0, 0, "DF_DN", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("DA_Sort1", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "DA_Sort1", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("DA_Day1", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "DA_Day1", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("DA_Up1", OleDbType.Currency, 0, ParameterDirection.Input, 0, 0, "DA_Up1", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("DA_Dn1", OleDbType.Currency, 0, ParameterDirection.Input, 0, 0, "DA_Dn1", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("DA_Num1", OleDbType.Currency, 0, ParameterDirection.Input, 0, 0, "DA_Num1", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("DA_Sort2", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "DA_Sort2", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("DA_Day2", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "DA_Day2", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("DA_Up2", OleDbType.Currency, 0, ParameterDirection.Input, 0, 0, "DA_Up2", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("DA_Dn2", OleDbType.Currency, 0, ParameterDirection.Input, 0, 0, "DA_Dn2", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("DA_Num2", OleDbType.Currency, 0, ParameterDirection.Input, 0, 0, "DA_Num2", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("DA_Sort3", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "DA_Sort3", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("DA_Day3", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "DA_Day3", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("DA_Up3", OleDbType.Currency, 0, ParameterDirection.Input, 0, 0, "DA_Up3", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("DA_Dn3", OleDbType.Currency, 0, ParameterDirection.Input, 0, 0, "DA_Dn3", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("DA_Num3", OleDbType.Currency, 0, ParameterDirection.Input, 0, 0, "DA_Num3", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("DA_Sort4", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "DA_Sort4", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("DA_Day4", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "DA_Day4", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("DA_Up4", OleDbType.Currency, 0, ParameterDirection.Input, 0, 0, "DA_Up4", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("DA_Dn4", OleDbType.Currency, 0, ParameterDirection.Input, 0, 0, "DA_Dn4", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("DA_Num4", OleDbType.Currency, 0, ParameterDirection.Input, 0, 0, "DA_Num4", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("Name", OleDbType.VarWChar, 0, ParameterDirection.Input, 0, 0, "Name", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("Text1", OleDbType.VarWChar, 0, ParameterDirection.Input, 0, 0, "Text1", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("Text2", OleDbType.VarWChar, 0, ParameterDirection.Input, 0, 0, "Text2", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("Text3", OleDbType.VarWChar, 0, ParameterDirection.Input, 0, 0, "Text3", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("Text4", OleDbType.VarWChar, 0, ParameterDirection.Input, 0, 0, "Text4", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("Text5", OleDbType.VarWChar, 0, ParameterDirection.Input, 0, 0, "Text5", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("Text6", OleDbType.VarWChar, 0, ParameterDirection.Input, 0, 0, "Text6", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("Text7", OleDbType.VarWChar, 0, ParameterDirection.Input, 0, 0, "Text7", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("TaxType", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "TaxType", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("Tax", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "Tax", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("SspValue1", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "SspValue1", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("SspValue2", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "SspValue2", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("SspValue3", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "SspValue3", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("SspValue4", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "SspValue4", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.InsertCommand.Parameters.Add(new OleDbParameter("SType", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "SType", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand = new OleDbCommand();
		_adapter.UpdateCommand.Connection = Connection;
		_adapter.UpdateCommand.CommandText = "UPDATE `rPLU` SET `PLUID` = ?, `Valid` = ?, `Remark` = ?, `Index` = ?, `UnitID` = ?, `Price` = ?, `Cost` = ?, `Tare` = ?, `BarF1` = ?, `BarF2` = ?, `BarT1` = ?, `BarT2` = ?, `LabelID1` = ?, `LabelID2` = ?, `ClassID` = ?, `PS_SD` = ?, `PS_ST` = ?, `PS_PD` = ?, `PS_PT` = ?, `PS_UD` = ?, `PC_SD` = ?, `PC_ST` = ?, `PC_PD` = ?, `PC_PT` = ?, `PC_UD` = ?, `DF_U` = ?, `DF_D` = ?, `DF_UN` = ?, `DF_DN` = ?, `DA_Sort1` = ?, `DA_Day1` = ?, `DA_Up1` = ?, `DA_Dn1` = ?, `DA_Num1` = ?, `DA_Sort2` = ?, `DA_Day2` = ?, `DA_Up2` = ?, `DA_Dn2` = ?, `DA_Num2` = ?, `DA_Sort3` = ?, `DA_Day3` = ?, `DA_Up3` = ?, `DA_Dn3` = ?, `DA_Num3` = ?, `DA_Sort4` = ?, `DA_Day4` = ?, `DA_Up4` = ?, `DA_Dn4` = ?, `DA_Num4` = ?, `Name` = ?, `Text1` = ?, `Text2` = ?, `Text3` = ?, `Text4` = ?, `Text5` = ?, `Text6` = ?, `Text7` = ?, `TaxType` = ?, `Tax` = ?, `SspValue1` = ?, `SspValue2` = ?, `SspValue3` = ?, `SspValue4` = ?, `SType` = ? WHERE ((`PLUID` = ?) AND ((? = 1 AND `Valid` IS NULL) OR (`Valid` = ?)) AND ((? = 1 AND `Remark` IS NULL) OR (`Remark` = ?)) AND ((? = 1 AND `Index` IS NULL) OR (`Index` = ?)) AND ((? = 1 AND `UnitID` IS NULL) OR (`UnitID` = ?)) AND ((? = 1 AND `Price` IS NULL) OR (`Price` = ?)) AND ((? = 1 AND `Cost` IS NULL) OR (`Cost` = ?)) AND ((? = 1 AND `Tare` IS NULL) OR (`Tare` = ?)) AND ((? = 1 AND `BarF1` IS NULL) OR (`BarF1` = ?)) AND ((? = 1 AND `BarF2` IS NULL) OR (`BarF2` = ?)) AND ((? = 1 AND `BarT1` IS NULL) OR (`BarT1` = ?)) AND ((? = 1 AND `BarT2` IS NULL) OR (`BarT2` = ?)) AND ((? = 1 AND `LabelID1` IS NULL) OR (`LabelID1` = ?)) AND ((? = 1 AND `LabelID2` IS NULL) OR (`LabelID2` = ?)) AND ((? = 1 AND `ClassID` IS NULL) OR (`ClassID` = ?)) AND ((? = 1 AND `PS_SD` IS NULL) OR (`PS_SD` = ?)) AND ((? = 1 AND `PS_ST` IS NULL) OR (`PS_ST` = ?)) AND ((? = 1 AND `PS_PD` IS NULL) OR (`PS_PD` = ?)) AND ((? = 1 AND `PS_PT` IS NULL) OR (`PS_PT` = ?)) AND ((? = 1 AND `PS_UD` IS NULL) OR (`PS_UD` = ?)) AND ((? = 1 AND `PC_SD` IS NULL) OR (`PC_SD` = ?)) AND ((? = 1 AND `PC_ST` IS NULL) OR (`PC_ST` = ?)) AND ((? = 1 AND `PC_PD` IS NULL) OR (`PC_PD` = ?)) AND ((? = 1 AND `PC_PT` IS NULL) OR (`PC_PT` = ?)) AND ((? = 1 AND `PC_UD` IS NULL) OR (`PC_UD` = ?)) AND ((? = 1 AND `DF_U` IS NULL) OR (`DF_U` = ?)) AND ((? = 1 AND `DF_D` IS NULL) OR (`DF_D` = ?)) AND ((? = 1 AND `DF_UN` IS NULL) OR (`DF_UN` = ?)) AND ((? = 1 AND `DF_DN` IS NULL) OR (`DF_DN` = ?)) AND ((? = 1 AND `DA_Sort1` IS NULL) OR (`DA_Sort1` = ?)) AND ((? = 1 AND `DA_Day1` IS NULL) OR (`DA_Day1` = ?)) AND ((? = 1 AND `DA_Up1` IS NULL) OR (`DA_Up1` = ?)) AND ((? = 1 AND `DA_Dn1` IS NULL) OR (`DA_Dn1` = ?)) AND ((? = 1 AND `DA_Num1` IS NULL) OR (`DA_Num1` = ?)) AND ((? = 1 AND `DA_Sort2` IS NULL) OR (`DA_Sort2` = ?)) AND ((? = 1 AND `DA_Day2` IS NULL) OR (`DA_Day2` = ?)) AND ((? = 1 AND `DA_Up2` IS NULL) OR (`DA_Up2` = ?)) AND ((? = 1 AND `DA_Dn2` IS NULL) OR (`DA_Dn2` = ?)) AND ((? = 1 AND `DA_Num2` IS NULL) OR (`DA_Num2` = ?)) AND ((? = 1 AND `DA_Sort3` IS NULL) OR (`DA_Sort3` = ?)) AND ((? = 1 AND `DA_Day3` IS NULL) OR (`DA_Day3` = ?)) AND ((? = 1 AND `DA_Up3` IS NULL) OR (`DA_Up3` = ?)) AND ((? = 1 AND `DA_Dn3` IS NULL) OR (`DA_Dn3` = ?)) AND ((? = 1 AND `DA_Num3` IS NULL) OR (`DA_Num3` = ?)) AND ((? = 1 AND `DA_Sort4` IS NULL) OR (`DA_Sort4` = ?)) AND ((? = 1 AND `DA_Day4` IS NULL) OR (`DA_Day4` = ?)) AND ((? = 1 AND `DA_Up4` IS NULL) OR (`DA_Up4` = ?)) AND ((? = 1 AND `DA_Dn4` IS NULL) OR (`DA_Dn4` = ?)) AND ((? = 1 AND `DA_Num4` IS NULL) OR (`DA_Num4` = ?)) AND ((? = 1 AND `Name` IS NULL) OR (`Name` = ?)) AND ((? = 1 AND `Text1` IS NULL) OR (`Text1` = ?)) AND ((? = 1 AND `Text2` IS NULL) OR (`Text2` = ?)) AND ((? = 1 AND `Text3` IS NULL) OR (`Text3` = ?)) AND ((? = 1 AND `Text4` IS NULL) OR (`Text4` = ?)) AND ((? = 1 AND `Text5` IS NULL) OR (`Text5` = ?)) AND ((? = 1 AND `Text6` IS NULL) OR (`Text6` = ?)) AND ((? = 1 AND `Text7` IS NULL) OR (`Text7` = ?)) AND ((? = 1 AND `TaxType` IS NULL) OR (`TaxType` = ?)) AND ((? = 1 AND `Tax` IS NULL) OR (`Tax` = ?)) AND ((? = 1 AND `SspValue1` IS NULL) OR (`SspValue1` = ?)) AND ((? = 1 AND `SspValue2` IS NULL) OR (`SspValue2` = ?)) AND ((? = 1 AND `SspValue3` IS NULL) OR (`SspValue3` = ?)) AND ((? = 1 AND `SspValue4` IS NULL) OR (`SspValue4` = ?)) AND ((? = 1 AND `SType` IS NULL) OR (`SType` = ?)))";
		_adapter.UpdateCommand.CommandType = CommandType.Text;
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("PLUID", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "PLUID", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("Valid", OleDbType.Boolean, 0, ParameterDirection.Input, 0, 0, "Valid", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("Remark", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "Remark", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("Index", OleDbType.VarWChar, 0, ParameterDirection.Input, 0, 0, "Index", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("UnitID", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "UnitID", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("Price", OleDbType.Currency, 0, ParameterDirection.Input, 0, 0, "Price", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("Cost", OleDbType.Currency, 0, ParameterDirection.Input, 0, 0, "Cost", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("Tare", OleDbType.Currency, 0, ParameterDirection.Input, 0, 0, "Tare", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("BarF1", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "BarF1", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("BarF2", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "BarF2", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("BarT1", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "BarT1", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("BarT2", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "BarT2", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("LabelID1", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "LabelID1", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("LabelID2", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "LabelID2", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("ClassID", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "ClassID", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("PS_SD", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "PS_SD", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("PS_ST", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "PS_ST", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("PS_PD", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "PS_PD", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("PS_PT", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "PS_PT", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("PS_UD", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "PS_UD", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("PC_SD", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "PC_SD", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("PC_ST", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "PC_ST", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("PC_PD", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "PC_PD", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("PC_PT", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "PC_PT", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("PC_UD", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "PC_UD", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("DF_U", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "DF_U", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("DF_D", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "DF_D", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("DF_UN", OleDbType.Currency, 0, ParameterDirection.Input, 0, 0, "DF_UN", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("DF_DN", OleDbType.Currency, 0, ParameterDirection.Input, 0, 0, "DF_DN", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("DA_Sort1", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "DA_Sort1", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("DA_Day1", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "DA_Day1", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("DA_Up1", OleDbType.Currency, 0, ParameterDirection.Input, 0, 0, "DA_Up1", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("DA_Dn1", OleDbType.Currency, 0, ParameterDirection.Input, 0, 0, "DA_Dn1", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("DA_Num1", OleDbType.Currency, 0, ParameterDirection.Input, 0, 0, "DA_Num1", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("DA_Sort2", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "DA_Sort2", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("DA_Day2", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "DA_Day2", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("DA_Up2", OleDbType.Currency, 0, ParameterDirection.Input, 0, 0, "DA_Up2", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("DA_Dn2", OleDbType.Currency, 0, ParameterDirection.Input, 0, 0, "DA_Dn2", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("DA_Num2", OleDbType.Currency, 0, ParameterDirection.Input, 0, 0, "DA_Num2", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("DA_Sort3", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "DA_Sort3", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("DA_Day3", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "DA_Day3", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("DA_Up3", OleDbType.Currency, 0, ParameterDirection.Input, 0, 0, "DA_Up3", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("DA_Dn3", OleDbType.Currency, 0, ParameterDirection.Input, 0, 0, "DA_Dn3", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("DA_Num3", OleDbType.Currency, 0, ParameterDirection.Input, 0, 0, "DA_Num3", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("DA_Sort4", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "DA_Sort4", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("DA_Day4", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "DA_Day4", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("DA_Up4", OleDbType.Currency, 0, ParameterDirection.Input, 0, 0, "DA_Up4", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("DA_Dn4", OleDbType.Currency, 0, ParameterDirection.Input, 0, 0, "DA_Dn4", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("DA_Num4", OleDbType.Currency, 0, ParameterDirection.Input, 0, 0, "DA_Num4", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("Name", OleDbType.VarWChar, 0, ParameterDirection.Input, 0, 0, "Name", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("Text1", OleDbType.VarWChar, 0, ParameterDirection.Input, 0, 0, "Text1", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("Text2", OleDbType.VarWChar, 0, ParameterDirection.Input, 0, 0, "Text2", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("Text3", OleDbType.VarWChar, 0, ParameterDirection.Input, 0, 0, "Text3", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("Text4", OleDbType.VarWChar, 0, ParameterDirection.Input, 0, 0, "Text4", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("Text5", OleDbType.VarWChar, 0, ParameterDirection.Input, 0, 0, "Text5", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("Text6", OleDbType.VarWChar, 0, ParameterDirection.Input, 0, 0, "Text6", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("Text7", OleDbType.VarWChar, 0, ParameterDirection.Input, 0, 0, "Text7", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("TaxType", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "TaxType", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("Tax", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "Tax", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("SspValue1", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "SspValue1", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("SspValue2", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "SspValue2", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("SspValue3", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "SspValue3", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("SspValue4", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "SspValue4", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("SType", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "SType", DataRowVersion.Current, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("Original_PLUID", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "PLUID", DataRowVersion.Original, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("IsNull_Valid", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "Valid", DataRowVersion.Original, sourceColumnNullMapping: true, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("Original_Valid", OleDbType.Boolean, 0, ParameterDirection.Input, 0, 0, "Valid", DataRowVersion.Original, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("IsNull_Remark", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "Remark", DataRowVersion.Original, sourceColumnNullMapping: true, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("Original_Remark", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "Remark", DataRowVersion.Original, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("IsNull_Index", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "Index", DataRowVersion.Original, sourceColumnNullMapping: true, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("Original_Index", OleDbType.VarWChar, 0, ParameterDirection.Input, 0, 0, "Index", DataRowVersion.Original, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("IsNull_UnitID", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "UnitID", DataRowVersion.Original, sourceColumnNullMapping: true, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("Original_UnitID", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "UnitID", DataRowVersion.Original, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("IsNull_Price", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "Price", DataRowVersion.Original, sourceColumnNullMapping: true, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("Original_Price", OleDbType.Currency, 0, ParameterDirection.Input, 0, 0, "Price", DataRowVersion.Original, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("IsNull_Cost", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "Cost", DataRowVersion.Original, sourceColumnNullMapping: true, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("Original_Cost", OleDbType.Currency, 0, ParameterDirection.Input, 0, 0, "Cost", DataRowVersion.Original, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("IsNull_Tare", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "Tare", DataRowVersion.Original, sourceColumnNullMapping: true, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("Original_Tare", OleDbType.Currency, 0, ParameterDirection.Input, 0, 0, "Tare", DataRowVersion.Original, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("IsNull_BarF1", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "BarF1", DataRowVersion.Original, sourceColumnNullMapping: true, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("Original_BarF1", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "BarF1", DataRowVersion.Original, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("IsNull_BarF2", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "BarF2", DataRowVersion.Original, sourceColumnNullMapping: true, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("Original_BarF2", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "BarF2", DataRowVersion.Original, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("IsNull_BarT1", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "BarT1", DataRowVersion.Original, sourceColumnNullMapping: true, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("Original_BarT1", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "BarT1", DataRowVersion.Original, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("IsNull_BarT2", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "BarT2", DataRowVersion.Original, sourceColumnNullMapping: true, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("Original_BarT2", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "BarT2", DataRowVersion.Original, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("IsNull_LabelID1", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "LabelID1", DataRowVersion.Original, sourceColumnNullMapping: true, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("Original_LabelID1", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "LabelID1", DataRowVersion.Original, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("IsNull_LabelID2", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "LabelID2", DataRowVersion.Original, sourceColumnNullMapping: true, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("Original_LabelID2", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "LabelID2", DataRowVersion.Original, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("IsNull_ClassID", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "ClassID", DataRowVersion.Original, sourceColumnNullMapping: true, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("Original_ClassID", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "ClassID", DataRowVersion.Original, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("IsNull_PS_SD", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "PS_SD", DataRowVersion.Original, sourceColumnNullMapping: true, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("Original_PS_SD", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "PS_SD", DataRowVersion.Original, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("IsNull_PS_ST", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "PS_ST", DataRowVersion.Original, sourceColumnNullMapping: true, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("Original_PS_ST", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "PS_ST", DataRowVersion.Original, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("IsNull_PS_PD", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "PS_PD", DataRowVersion.Original, sourceColumnNullMapping: true, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("Original_PS_PD", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "PS_PD", DataRowVersion.Original, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("IsNull_PS_PT", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "PS_PT", DataRowVersion.Original, sourceColumnNullMapping: true, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("Original_PS_PT", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "PS_PT", DataRowVersion.Original, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("IsNull_PS_UD", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "PS_UD", DataRowVersion.Original, sourceColumnNullMapping: true, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("Original_PS_UD", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "PS_UD", DataRowVersion.Original, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("IsNull_PC_SD", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "PC_SD", DataRowVersion.Original, sourceColumnNullMapping: true, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("Original_PC_SD", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "PC_SD", DataRowVersion.Original, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("IsNull_PC_ST", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "PC_ST", DataRowVersion.Original, sourceColumnNullMapping: true, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("Original_PC_ST", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "PC_ST", DataRowVersion.Original, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("IsNull_PC_PD", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "PC_PD", DataRowVersion.Original, sourceColumnNullMapping: true, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("Original_PC_PD", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "PC_PD", DataRowVersion.Original, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("IsNull_PC_PT", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "PC_PT", DataRowVersion.Original, sourceColumnNullMapping: true, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("Original_PC_PT", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "PC_PT", DataRowVersion.Original, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("IsNull_PC_UD", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "PC_UD", DataRowVersion.Original, sourceColumnNullMapping: true, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("Original_PC_UD", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "PC_UD", DataRowVersion.Original, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("IsNull_DF_U", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "DF_U", DataRowVersion.Original, sourceColumnNullMapping: true, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("Original_DF_U", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "DF_U", DataRowVersion.Original, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("IsNull_DF_D", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "DF_D", DataRowVersion.Original, sourceColumnNullMapping: true, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("Original_DF_D", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "DF_D", DataRowVersion.Original, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("IsNull_DF_UN", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "DF_UN", DataRowVersion.Original, sourceColumnNullMapping: true, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("Original_DF_UN", OleDbType.Currency, 0, ParameterDirection.Input, 0, 0, "DF_UN", DataRowVersion.Original, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("IsNull_DF_DN", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "DF_DN", DataRowVersion.Original, sourceColumnNullMapping: true, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("Original_DF_DN", OleDbType.Currency, 0, ParameterDirection.Input, 0, 0, "DF_DN", DataRowVersion.Original, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("IsNull_DA_Sort1", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "DA_Sort1", DataRowVersion.Original, sourceColumnNullMapping: true, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("Original_DA_Sort1", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "DA_Sort1", DataRowVersion.Original, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("IsNull_DA_Day1", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "DA_Day1", DataRowVersion.Original, sourceColumnNullMapping: true, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("Original_DA_Day1", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "DA_Day1", DataRowVersion.Original, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("IsNull_DA_Up1", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "DA_Up1", DataRowVersion.Original, sourceColumnNullMapping: true, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("Original_DA_Up1", OleDbType.Currency, 0, ParameterDirection.Input, 0, 0, "DA_Up1", DataRowVersion.Original, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("IsNull_DA_Dn1", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "DA_Dn1", DataRowVersion.Original, sourceColumnNullMapping: true, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("Original_DA_Dn1", OleDbType.Currency, 0, ParameterDirection.Input, 0, 0, "DA_Dn1", DataRowVersion.Original, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("IsNull_DA_Num1", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "DA_Num1", DataRowVersion.Original, sourceColumnNullMapping: true, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("Original_DA_Num1", OleDbType.Currency, 0, ParameterDirection.Input, 0, 0, "DA_Num1", DataRowVersion.Original, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("IsNull_DA_Sort2", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "DA_Sort2", DataRowVersion.Original, sourceColumnNullMapping: true, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("Original_DA_Sort2", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "DA_Sort2", DataRowVersion.Original, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("IsNull_DA_Day2", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "DA_Day2", DataRowVersion.Original, sourceColumnNullMapping: true, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("Original_DA_Day2", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "DA_Day2", DataRowVersion.Original, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("IsNull_DA_Up2", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "DA_Up2", DataRowVersion.Original, sourceColumnNullMapping: true, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("Original_DA_Up2", OleDbType.Currency, 0, ParameterDirection.Input, 0, 0, "DA_Up2", DataRowVersion.Original, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("IsNull_DA_Dn2", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "DA_Dn2", DataRowVersion.Original, sourceColumnNullMapping: true, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("Original_DA_Dn2", OleDbType.Currency, 0, ParameterDirection.Input, 0, 0, "DA_Dn2", DataRowVersion.Original, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("IsNull_DA_Num2", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "DA_Num2", DataRowVersion.Original, sourceColumnNullMapping: true, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("Original_DA_Num2", OleDbType.Currency, 0, ParameterDirection.Input, 0, 0, "DA_Num2", DataRowVersion.Original, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("IsNull_DA_Sort3", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "DA_Sort3", DataRowVersion.Original, sourceColumnNullMapping: true, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("Original_DA_Sort3", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "DA_Sort3", DataRowVersion.Original, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("IsNull_DA_Day3", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "DA_Day3", DataRowVersion.Original, sourceColumnNullMapping: true, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("Original_DA_Day3", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "DA_Day3", DataRowVersion.Original, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("IsNull_DA_Up3", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "DA_Up3", DataRowVersion.Original, sourceColumnNullMapping: true, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("Original_DA_Up3", OleDbType.Currency, 0, ParameterDirection.Input, 0, 0, "DA_Up3", DataRowVersion.Original, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("IsNull_DA_Dn3", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "DA_Dn3", DataRowVersion.Original, sourceColumnNullMapping: true, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("Original_DA_Dn3", OleDbType.Currency, 0, ParameterDirection.Input, 0, 0, "DA_Dn3", DataRowVersion.Original, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("IsNull_DA_Num3", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "DA_Num3", DataRowVersion.Original, sourceColumnNullMapping: true, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("Original_DA_Num3", OleDbType.Currency, 0, ParameterDirection.Input, 0, 0, "DA_Num3", DataRowVersion.Original, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("IsNull_DA_Sort4", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "DA_Sort4", DataRowVersion.Original, sourceColumnNullMapping: true, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("Original_DA_Sort4", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "DA_Sort4", DataRowVersion.Original, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("IsNull_DA_Day4", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "DA_Day4", DataRowVersion.Original, sourceColumnNullMapping: true, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("Original_DA_Day4", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "DA_Day4", DataRowVersion.Original, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("IsNull_DA_Up4", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "DA_Up4", DataRowVersion.Original, sourceColumnNullMapping: true, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("Original_DA_Up4", OleDbType.Currency, 0, ParameterDirection.Input, 0, 0, "DA_Up4", DataRowVersion.Original, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("IsNull_DA_Dn4", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "DA_Dn4", DataRowVersion.Original, sourceColumnNullMapping: true, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("Original_DA_Dn4", OleDbType.Currency, 0, ParameterDirection.Input, 0, 0, "DA_Dn4", DataRowVersion.Original, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("IsNull_DA_Num4", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "DA_Num4", DataRowVersion.Original, sourceColumnNullMapping: true, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("Original_DA_Num4", OleDbType.Currency, 0, ParameterDirection.Input, 0, 0, "DA_Num4", DataRowVersion.Original, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("IsNull_Name", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "Name", DataRowVersion.Original, sourceColumnNullMapping: true, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("Original_Name", OleDbType.VarWChar, 0, ParameterDirection.Input, 0, 0, "Name", DataRowVersion.Original, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("IsNull_Text1", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "Text1", DataRowVersion.Original, sourceColumnNullMapping: true, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("Original_Text1", OleDbType.VarWChar, 0, ParameterDirection.Input, 0, 0, "Text1", DataRowVersion.Original, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("IsNull_Text2", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "Text2", DataRowVersion.Original, sourceColumnNullMapping: true, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("Original_Text2", OleDbType.VarWChar, 0, ParameterDirection.Input, 0, 0, "Text2", DataRowVersion.Original, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("IsNull_Text3", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "Text3", DataRowVersion.Original, sourceColumnNullMapping: true, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("Original_Text3", OleDbType.VarWChar, 0, ParameterDirection.Input, 0, 0, "Text3", DataRowVersion.Original, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("IsNull_Text4", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "Text4", DataRowVersion.Original, sourceColumnNullMapping: true, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("Original_Text4", OleDbType.VarWChar, 0, ParameterDirection.Input, 0, 0, "Text4", DataRowVersion.Original, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("IsNull_Text5", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "Text5", DataRowVersion.Original, sourceColumnNullMapping: true, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("Original_Text5", OleDbType.VarWChar, 0, ParameterDirection.Input, 0, 0, "Text5", DataRowVersion.Original, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("IsNull_Text6", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "Text6", DataRowVersion.Original, sourceColumnNullMapping: true, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("Original_Text6", OleDbType.VarWChar, 0, ParameterDirection.Input, 0, 0, "Text6", DataRowVersion.Original, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("IsNull_Text7", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "Text7", DataRowVersion.Original, sourceColumnNullMapping: true, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("Original_Text7", OleDbType.VarWChar, 0, ParameterDirection.Input, 0, 0, "Text7", DataRowVersion.Original, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("IsNull_TaxType", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "TaxType", DataRowVersion.Original, sourceColumnNullMapping: true, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("Original_TaxType", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "TaxType", DataRowVersion.Original, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("IsNull_Tax", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "Tax", DataRowVersion.Original, sourceColumnNullMapping: true, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("Original_Tax", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "Tax", DataRowVersion.Original, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("IsNull_SspValue1", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "SspValue1", DataRowVersion.Original, sourceColumnNullMapping: true, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("Original_SspValue1", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "SspValue1", DataRowVersion.Original, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("IsNull_SspValue2", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "SspValue2", DataRowVersion.Original, sourceColumnNullMapping: true, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("Original_SspValue2", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "SspValue2", DataRowVersion.Original, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("IsNull_SspValue3", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "SspValue3", DataRowVersion.Original, sourceColumnNullMapping: true, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("Original_SspValue3", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "SspValue3", DataRowVersion.Original, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("IsNull_SspValue4", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "SspValue4", DataRowVersion.Original, sourceColumnNullMapping: true, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("Original_SspValue4", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "SspValue4", DataRowVersion.Original, sourceColumnNullMapping: false, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("IsNull_SType", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "SType", DataRowVersion.Original, sourceColumnNullMapping: true, null));
		_adapter.UpdateCommand.Parameters.Add(new OleDbParameter("Original_SType", OleDbType.Integer, 0, ParameterDirection.Input, 0, 0, "SType", DataRowVersion.Original, sourceColumnNullMapping: false, null));
	}

	[DebuggerNonUserCode]
	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
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
		_commandCollection[0].CommandText = "SELECT *\r\nFROM rPLU";
		_commandCollection[0].CommandType = CommandType.Text;
	}

	[HelpKeyword("vs.data.TableAdapter")]
	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	[DataObjectMethod(DataObjectMethodType.Fill, true)]
	[DebuggerNonUserCode]
	public virtual int Fill(ReportDataSet.rPLUDataTable dataTable)
	{
		Adapter.SelectCommand = CommandCollection[0];
		if (ClearBeforeFill)
		{
			dataTable.Clear();
		}
		return Adapter.Fill(dataTable);
	}

	[HelpKeyword("vs.data.TableAdapter")]
	[DebuggerNonUserCode]
	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	public virtual int Update(ReportDataSet.rPLUDataTable dataTable)
	{
		return Adapter.Update(dataTable);
	}

	[DebuggerNonUserCode]
	[HelpKeyword("vs.data.TableAdapter")]
	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	public virtual int Update(ReportDataSet dataSet)
	{
		return Adapter.Update(dataSet, "rPLU");
	}

	[HelpKeyword("vs.data.TableAdapter")]
	[DebuggerNonUserCode]
	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	public virtual int Update(DataRow dataRow)
	{
		return Adapter.Update(new DataRow[1] { dataRow });
	}

	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	[DebuggerNonUserCode]
	[HelpKeyword("vs.data.TableAdapter")]
	public virtual int Update(DataRow[] dataRows)
	{
		return Adapter.Update(dataRows);
	}

	[HelpKeyword("vs.data.TableAdapter")]
	[DataObjectMethod(DataObjectMethodType.Delete, true)]
	[DebuggerNonUserCode]
	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	public virtual int Delete(int? Original_PLUID, bool Original_Valid, int? Original_Remark, string Original_Index, int? Original_UnitID, decimal? Original_Price, decimal? Original_Cost, decimal? Original_Tare, int? Original_BarF1, int? Original_BarF2, int? Original_BarT1, int? Original_BarT2, int? Original_LabelID1, int? Original_LabelID2, int? Original_ClassID, int? Original_PS_SD, int? Original_PS_ST, int? Original_PS_PD, int? Original_PS_PT, int? Original_PS_UD, int? Original_PC_SD, int? Original_PC_ST, int? Original_PC_PD, int? Original_PC_PT, int? Original_PC_UD, int? Original_DF_U, int? Original_DF_D, decimal? Original_DF_UN, decimal? Original_DF_DN, int? Original_DA_Sort1, int? Original_DA_Day1, decimal? Original_DA_Up1, decimal? Original_DA_Dn1, decimal? Original_DA_Num1, int? Original_DA_Sort2, int? Original_DA_Day2, decimal? Original_DA_Up2, decimal? Original_DA_Dn2, decimal? Original_DA_Num2, int? Original_DA_Sort3, int? Original_DA_Day3, decimal? Original_DA_Up3, decimal? Original_DA_Dn3, decimal? Original_DA_Num3, int? Original_DA_Sort4, int? Original_DA_Day4, decimal? Original_DA_Up4, decimal? Original_DA_Dn4, decimal? Original_DA_Num4, string Original_Name, string Original_Text1, string Original_Text2, string Original_Text3, string Original_Text4, string Original_Text5, string Original_Text6, string Original_Text7, int? Original_TaxType, int? Original_Tax, int? Original_SspValue1, int? Original_SspValue2, int? Original_SspValue3, int? Original_SspValue4, int? Original_SType)
	{
		if (Original_PLUID.HasValue)
		{
			Adapter.DeleteCommand.Parameters[0].Value = Original_PLUID.Value;
		}
		else
		{
			Adapter.DeleteCommand.Parameters[0].Value = DBNull.Value;
		}
		Adapter.DeleteCommand.Parameters[1].Value = 0;
		Adapter.DeleteCommand.Parameters[2].Value = Original_Valid;
		if (Original_Remark.HasValue)
		{
			Adapter.DeleteCommand.Parameters[3].Value = 0;
			Adapter.DeleteCommand.Parameters[4].Value = Original_Remark.Value;
		}
		else
		{
			Adapter.DeleteCommand.Parameters[3].Value = 1;
			Adapter.DeleteCommand.Parameters[4].Value = DBNull.Value;
		}
		if (Original_Index == null)
		{
			Adapter.DeleteCommand.Parameters[5].Value = 1;
			Adapter.DeleteCommand.Parameters[6].Value = DBNull.Value;
		}
		else
		{
			Adapter.DeleteCommand.Parameters[5].Value = 0;
			Adapter.DeleteCommand.Parameters[6].Value = Original_Index;
		}
		if (Original_UnitID.HasValue)
		{
			Adapter.DeleteCommand.Parameters[7].Value = 0;
			Adapter.DeleteCommand.Parameters[8].Value = Original_UnitID.Value;
		}
		else
		{
			Adapter.DeleteCommand.Parameters[7].Value = 1;
			Adapter.DeleteCommand.Parameters[8].Value = DBNull.Value;
		}
		if (Original_Price.HasValue)
		{
			Adapter.DeleteCommand.Parameters[9].Value = 0;
			Adapter.DeleteCommand.Parameters[10].Value = Original_Price.Value;
		}
		else
		{
			Adapter.DeleteCommand.Parameters[9].Value = 1;
			Adapter.DeleteCommand.Parameters[10].Value = DBNull.Value;
		}
		if (Original_Cost.HasValue)
		{
			Adapter.DeleteCommand.Parameters[11].Value = 0;
			Adapter.DeleteCommand.Parameters[12].Value = Original_Cost.Value;
		}
		else
		{
			Adapter.DeleteCommand.Parameters[11].Value = 1;
			Adapter.DeleteCommand.Parameters[12].Value = DBNull.Value;
		}
		if (Original_Tare.HasValue)
		{
			Adapter.DeleteCommand.Parameters[13].Value = 0;
			Adapter.DeleteCommand.Parameters[14].Value = Original_Tare.Value;
		}
		else
		{
			Adapter.DeleteCommand.Parameters[13].Value = 1;
			Adapter.DeleteCommand.Parameters[14].Value = DBNull.Value;
		}
		if (Original_BarF1.HasValue)
		{
			Adapter.DeleteCommand.Parameters[15].Value = 0;
			Adapter.DeleteCommand.Parameters[16].Value = Original_BarF1.Value;
		}
		else
		{
			Adapter.DeleteCommand.Parameters[15].Value = 1;
			Adapter.DeleteCommand.Parameters[16].Value = DBNull.Value;
		}
		if (Original_BarF2.HasValue)
		{
			Adapter.DeleteCommand.Parameters[17].Value = 0;
			Adapter.DeleteCommand.Parameters[18].Value = Original_BarF2.Value;
		}
		else
		{
			Adapter.DeleteCommand.Parameters[17].Value = 1;
			Adapter.DeleteCommand.Parameters[18].Value = DBNull.Value;
		}
		if (Original_BarT1.HasValue)
		{
			Adapter.DeleteCommand.Parameters[19].Value = 0;
			Adapter.DeleteCommand.Parameters[20].Value = Original_BarT1.Value;
		}
		else
		{
			Adapter.DeleteCommand.Parameters[19].Value = 1;
			Adapter.DeleteCommand.Parameters[20].Value = DBNull.Value;
		}
		if (Original_BarT2.HasValue)
		{
			Adapter.DeleteCommand.Parameters[21].Value = 0;
			Adapter.DeleteCommand.Parameters[22].Value = Original_BarT2.Value;
		}
		else
		{
			Adapter.DeleteCommand.Parameters[21].Value = 1;
			Adapter.DeleteCommand.Parameters[22].Value = DBNull.Value;
		}
		if (Original_LabelID1.HasValue)
		{
			Adapter.DeleteCommand.Parameters[23].Value = 0;
			Adapter.DeleteCommand.Parameters[24].Value = Original_LabelID1.Value;
		}
		else
		{
			Adapter.DeleteCommand.Parameters[23].Value = 1;
			Adapter.DeleteCommand.Parameters[24].Value = DBNull.Value;
		}
		if (Original_LabelID2.HasValue)
		{
			Adapter.DeleteCommand.Parameters[25].Value = 0;
			Adapter.DeleteCommand.Parameters[26].Value = Original_LabelID2.Value;
		}
		else
		{
			Adapter.DeleteCommand.Parameters[25].Value = 1;
			Adapter.DeleteCommand.Parameters[26].Value = DBNull.Value;
		}
		if (Original_ClassID.HasValue)
		{
			Adapter.DeleteCommand.Parameters[27].Value = 0;
			Adapter.DeleteCommand.Parameters[28].Value = Original_ClassID.Value;
		}
		else
		{
			Adapter.DeleteCommand.Parameters[27].Value = 1;
			Adapter.DeleteCommand.Parameters[28].Value = DBNull.Value;
		}
		if (Original_PS_SD.HasValue)
		{
			Adapter.DeleteCommand.Parameters[29].Value = 0;
			Adapter.DeleteCommand.Parameters[30].Value = Original_PS_SD.Value;
		}
		else
		{
			Adapter.DeleteCommand.Parameters[29].Value = 1;
			Adapter.DeleteCommand.Parameters[30].Value = DBNull.Value;
		}
		if (Original_PS_ST.HasValue)
		{
			Adapter.DeleteCommand.Parameters[31].Value = 0;
			Adapter.DeleteCommand.Parameters[32].Value = Original_PS_ST.Value;
		}
		else
		{
			Adapter.DeleteCommand.Parameters[31].Value = 1;
			Adapter.DeleteCommand.Parameters[32].Value = DBNull.Value;
		}
		if (Original_PS_PD.HasValue)
		{
			Adapter.DeleteCommand.Parameters[33].Value = 0;
			Adapter.DeleteCommand.Parameters[34].Value = Original_PS_PD.Value;
		}
		else
		{
			Adapter.DeleteCommand.Parameters[33].Value = 1;
			Adapter.DeleteCommand.Parameters[34].Value = DBNull.Value;
		}
		if (Original_PS_PT.HasValue)
		{
			Adapter.DeleteCommand.Parameters[35].Value = 0;
			Adapter.DeleteCommand.Parameters[36].Value = Original_PS_PT.Value;
		}
		else
		{
			Adapter.DeleteCommand.Parameters[35].Value = 1;
			Adapter.DeleteCommand.Parameters[36].Value = DBNull.Value;
		}
		if (Original_PS_UD.HasValue)
		{
			Adapter.DeleteCommand.Parameters[37].Value = 0;
			Adapter.DeleteCommand.Parameters[38].Value = Original_PS_UD.Value;
		}
		else
		{
			Adapter.DeleteCommand.Parameters[37].Value = 1;
			Adapter.DeleteCommand.Parameters[38].Value = DBNull.Value;
		}
		if (Original_PC_SD.HasValue)
		{
			Adapter.DeleteCommand.Parameters[39].Value = 0;
			Adapter.DeleteCommand.Parameters[40].Value = Original_PC_SD.Value;
		}
		else
		{
			Adapter.DeleteCommand.Parameters[39].Value = 1;
			Adapter.DeleteCommand.Parameters[40].Value = DBNull.Value;
		}
		if (Original_PC_ST.HasValue)
		{
			Adapter.DeleteCommand.Parameters[41].Value = 0;
			Adapter.DeleteCommand.Parameters[42].Value = Original_PC_ST.Value;
		}
		else
		{
			Adapter.DeleteCommand.Parameters[41].Value = 1;
			Adapter.DeleteCommand.Parameters[42].Value = DBNull.Value;
		}
		if (Original_PC_PD.HasValue)
		{
			Adapter.DeleteCommand.Parameters[43].Value = 0;
			Adapter.DeleteCommand.Parameters[44].Value = Original_PC_PD.Value;
		}
		else
		{
			Adapter.DeleteCommand.Parameters[43].Value = 1;
			Adapter.DeleteCommand.Parameters[44].Value = DBNull.Value;
		}
		if (Original_PC_PT.HasValue)
		{
			Adapter.DeleteCommand.Parameters[45].Value = 0;
			Adapter.DeleteCommand.Parameters[46].Value = Original_PC_PT.Value;
		}
		else
		{
			Adapter.DeleteCommand.Parameters[45].Value = 1;
			Adapter.DeleteCommand.Parameters[46].Value = DBNull.Value;
		}
		if (Original_PC_UD.HasValue)
		{
			Adapter.DeleteCommand.Parameters[47].Value = 0;
			Adapter.DeleteCommand.Parameters[48].Value = Original_PC_UD.Value;
		}
		else
		{
			Adapter.DeleteCommand.Parameters[47].Value = 1;
			Adapter.DeleteCommand.Parameters[48].Value = DBNull.Value;
		}
		if (Original_DF_U.HasValue)
		{
			Adapter.DeleteCommand.Parameters[49].Value = 0;
			Adapter.DeleteCommand.Parameters[50].Value = Original_DF_U.Value;
		}
		else
		{
			Adapter.DeleteCommand.Parameters[49].Value = 1;
			Adapter.DeleteCommand.Parameters[50].Value = DBNull.Value;
		}
		if (Original_DF_D.HasValue)
		{
			Adapter.DeleteCommand.Parameters[51].Value = 0;
			Adapter.DeleteCommand.Parameters[52].Value = Original_DF_D.Value;
		}
		else
		{
			Adapter.DeleteCommand.Parameters[51].Value = 1;
			Adapter.DeleteCommand.Parameters[52].Value = DBNull.Value;
		}
		if (Original_DF_UN.HasValue)
		{
			Adapter.DeleteCommand.Parameters[53].Value = 0;
			Adapter.DeleteCommand.Parameters[54].Value = Original_DF_UN.Value;
		}
		else
		{
			Adapter.DeleteCommand.Parameters[53].Value = 1;
			Adapter.DeleteCommand.Parameters[54].Value = DBNull.Value;
		}
		if (Original_DF_DN.HasValue)
		{
			Adapter.DeleteCommand.Parameters[55].Value = 0;
			Adapter.DeleteCommand.Parameters[56].Value = Original_DF_DN.Value;
		}
		else
		{
			Adapter.DeleteCommand.Parameters[55].Value = 1;
			Adapter.DeleteCommand.Parameters[56].Value = DBNull.Value;
		}
		if (Original_DA_Sort1.HasValue)
		{
			Adapter.DeleteCommand.Parameters[57].Value = 0;
			Adapter.DeleteCommand.Parameters[58].Value = Original_DA_Sort1.Value;
		}
		else
		{
			Adapter.DeleteCommand.Parameters[57].Value = 1;
			Adapter.DeleteCommand.Parameters[58].Value = DBNull.Value;
		}
		if (Original_DA_Day1.HasValue)
		{
			Adapter.DeleteCommand.Parameters[59].Value = 0;
			Adapter.DeleteCommand.Parameters[60].Value = Original_DA_Day1.Value;
		}
		else
		{
			Adapter.DeleteCommand.Parameters[59].Value = 1;
			Adapter.DeleteCommand.Parameters[60].Value = DBNull.Value;
		}
		if (Original_DA_Up1.HasValue)
		{
			Adapter.DeleteCommand.Parameters[61].Value = 0;
			Adapter.DeleteCommand.Parameters[62].Value = Original_DA_Up1.Value;
		}
		else
		{
			Adapter.DeleteCommand.Parameters[61].Value = 1;
			Adapter.DeleteCommand.Parameters[62].Value = DBNull.Value;
		}
		if (Original_DA_Dn1.HasValue)
		{
			Adapter.DeleteCommand.Parameters[63].Value = 0;
			Adapter.DeleteCommand.Parameters[64].Value = Original_DA_Dn1.Value;
		}
		else
		{
			Adapter.DeleteCommand.Parameters[63].Value = 1;
			Adapter.DeleteCommand.Parameters[64].Value = DBNull.Value;
		}
		if (Original_DA_Num1.HasValue)
		{
			Adapter.DeleteCommand.Parameters[65].Value = 0;
			Adapter.DeleteCommand.Parameters[66].Value = Original_DA_Num1.Value;
		}
		else
		{
			Adapter.DeleteCommand.Parameters[65].Value = 1;
			Adapter.DeleteCommand.Parameters[66].Value = DBNull.Value;
		}
		if (Original_DA_Sort2.HasValue)
		{
			Adapter.DeleteCommand.Parameters[67].Value = 0;
			Adapter.DeleteCommand.Parameters[68].Value = Original_DA_Sort2.Value;
		}
		else
		{
			Adapter.DeleteCommand.Parameters[67].Value = 1;
			Adapter.DeleteCommand.Parameters[68].Value = DBNull.Value;
		}
		if (Original_DA_Day2.HasValue)
		{
			Adapter.DeleteCommand.Parameters[69].Value = 0;
			Adapter.DeleteCommand.Parameters[70].Value = Original_DA_Day2.Value;
		}
		else
		{
			Adapter.DeleteCommand.Parameters[69].Value = 1;
			Adapter.DeleteCommand.Parameters[70].Value = DBNull.Value;
		}
		if (Original_DA_Up2.HasValue)
		{
			Adapter.DeleteCommand.Parameters[71].Value = 0;
			Adapter.DeleteCommand.Parameters[72].Value = Original_DA_Up2.Value;
		}
		else
		{
			Adapter.DeleteCommand.Parameters[71].Value = 1;
			Adapter.DeleteCommand.Parameters[72].Value = DBNull.Value;
		}
		if (Original_DA_Dn2.HasValue)
		{
			Adapter.DeleteCommand.Parameters[73].Value = 0;
			Adapter.DeleteCommand.Parameters[74].Value = Original_DA_Dn2.Value;
		}
		else
		{
			Adapter.DeleteCommand.Parameters[73].Value = 1;
			Adapter.DeleteCommand.Parameters[74].Value = DBNull.Value;
		}
		if (Original_DA_Num2.HasValue)
		{
			Adapter.DeleteCommand.Parameters[75].Value = 0;
			Adapter.DeleteCommand.Parameters[76].Value = Original_DA_Num2.Value;
		}
		else
		{
			Adapter.DeleteCommand.Parameters[75].Value = 1;
			Adapter.DeleteCommand.Parameters[76].Value = DBNull.Value;
		}
		if (Original_DA_Sort3.HasValue)
		{
			Adapter.DeleteCommand.Parameters[77].Value = 0;
			Adapter.DeleteCommand.Parameters[78].Value = Original_DA_Sort3.Value;
		}
		else
		{
			Adapter.DeleteCommand.Parameters[77].Value = 1;
			Adapter.DeleteCommand.Parameters[78].Value = DBNull.Value;
		}
		if (Original_DA_Day3.HasValue)
		{
			Adapter.DeleteCommand.Parameters[79].Value = 0;
			Adapter.DeleteCommand.Parameters[80].Value = Original_DA_Day3.Value;
		}
		else
		{
			Adapter.DeleteCommand.Parameters[79].Value = 1;
			Adapter.DeleteCommand.Parameters[80].Value = DBNull.Value;
		}
		if (Original_DA_Up3.HasValue)
		{
			Adapter.DeleteCommand.Parameters[81].Value = 0;
			Adapter.DeleteCommand.Parameters[82].Value = Original_DA_Up3.Value;
		}
		else
		{
			Adapter.DeleteCommand.Parameters[81].Value = 1;
			Adapter.DeleteCommand.Parameters[82].Value = DBNull.Value;
		}
		if (Original_DA_Dn3.HasValue)
		{
			Adapter.DeleteCommand.Parameters[83].Value = 0;
			Adapter.DeleteCommand.Parameters[84].Value = Original_DA_Dn3.Value;
		}
		else
		{
			Adapter.DeleteCommand.Parameters[83].Value = 1;
			Adapter.DeleteCommand.Parameters[84].Value = DBNull.Value;
		}
		if (Original_DA_Num3.HasValue)
		{
			Adapter.DeleteCommand.Parameters[85].Value = 0;
			Adapter.DeleteCommand.Parameters[86].Value = Original_DA_Num3.Value;
		}
		else
		{
			Adapter.DeleteCommand.Parameters[85].Value = 1;
			Adapter.DeleteCommand.Parameters[86].Value = DBNull.Value;
		}
		if (Original_DA_Sort4.HasValue)
		{
			Adapter.DeleteCommand.Parameters[87].Value = 0;
			Adapter.DeleteCommand.Parameters[88].Value = Original_DA_Sort4.Value;
		}
		else
		{
			Adapter.DeleteCommand.Parameters[87].Value = 1;
			Adapter.DeleteCommand.Parameters[88].Value = DBNull.Value;
		}
		if (Original_DA_Day4.HasValue)
		{
			Adapter.DeleteCommand.Parameters[89].Value = 0;
			Adapter.DeleteCommand.Parameters[90].Value = Original_DA_Day4.Value;
		}
		else
		{
			Adapter.DeleteCommand.Parameters[89].Value = 1;
			Adapter.DeleteCommand.Parameters[90].Value = DBNull.Value;
		}
		if (Original_DA_Up4.HasValue)
		{
			Adapter.DeleteCommand.Parameters[91].Value = 0;
			Adapter.DeleteCommand.Parameters[92].Value = Original_DA_Up4.Value;
		}
		else
		{
			Adapter.DeleteCommand.Parameters[91].Value = 1;
			Adapter.DeleteCommand.Parameters[92].Value = DBNull.Value;
		}
		if (Original_DA_Dn4.HasValue)
		{
			Adapter.DeleteCommand.Parameters[93].Value = 0;
			Adapter.DeleteCommand.Parameters[94].Value = Original_DA_Dn4.Value;
		}
		else
		{
			Adapter.DeleteCommand.Parameters[93].Value = 1;
			Adapter.DeleteCommand.Parameters[94].Value = DBNull.Value;
		}
		if (Original_DA_Num4.HasValue)
		{
			Adapter.DeleteCommand.Parameters[95].Value = 0;
			Adapter.DeleteCommand.Parameters[96].Value = Original_DA_Num4.Value;
		}
		else
		{
			Adapter.DeleteCommand.Parameters[95].Value = 1;
			Adapter.DeleteCommand.Parameters[96].Value = DBNull.Value;
		}
		if (Original_Name == null)
		{
			Adapter.DeleteCommand.Parameters[97].Value = 1;
			Adapter.DeleteCommand.Parameters[98].Value = DBNull.Value;
		}
		else
		{
			Adapter.DeleteCommand.Parameters[97].Value = 0;
			Adapter.DeleteCommand.Parameters[98].Value = Original_Name;
		}
		if (Original_Text1 == null)
		{
			Adapter.DeleteCommand.Parameters[99].Value = 1;
			Adapter.DeleteCommand.Parameters[100].Value = DBNull.Value;
		}
		else
		{
			Adapter.DeleteCommand.Parameters[99].Value = 0;
			Adapter.DeleteCommand.Parameters[100].Value = Original_Text1;
		}
		if (Original_Text2 == null)
		{
			Adapter.DeleteCommand.Parameters[101].Value = 1;
			Adapter.DeleteCommand.Parameters[102].Value = DBNull.Value;
		}
		else
		{
			Adapter.DeleteCommand.Parameters[101].Value = 0;
			Adapter.DeleteCommand.Parameters[102].Value = Original_Text2;
		}
		if (Original_Text3 == null)
		{
			Adapter.DeleteCommand.Parameters[103].Value = 1;
			Adapter.DeleteCommand.Parameters[104].Value = DBNull.Value;
		}
		else
		{
			Adapter.DeleteCommand.Parameters[103].Value = 0;
			Adapter.DeleteCommand.Parameters[104].Value = Original_Text3;
		}
		if (Original_Text4 == null)
		{
			Adapter.DeleteCommand.Parameters[105].Value = 1;
			Adapter.DeleteCommand.Parameters[106].Value = DBNull.Value;
		}
		else
		{
			Adapter.DeleteCommand.Parameters[105].Value = 0;
			Adapter.DeleteCommand.Parameters[106].Value = Original_Text4;
		}
		if (Original_Text5 == null)
		{
			Adapter.DeleteCommand.Parameters[107].Value = 1;
			Adapter.DeleteCommand.Parameters[108].Value = DBNull.Value;
		}
		else
		{
			Adapter.DeleteCommand.Parameters[107].Value = 0;
			Adapter.DeleteCommand.Parameters[108].Value = Original_Text5;
		}
		if (Original_Text6 == null)
		{
			Adapter.DeleteCommand.Parameters[109].Value = 1;
			Adapter.DeleteCommand.Parameters[110].Value = DBNull.Value;
		}
		else
		{
			Adapter.DeleteCommand.Parameters[109].Value = 0;
			Adapter.DeleteCommand.Parameters[110].Value = Original_Text6;
		}
		if (Original_Text7 == null)
		{
			Adapter.DeleteCommand.Parameters[111].Value = 1;
			Adapter.DeleteCommand.Parameters[112].Value = DBNull.Value;
		}
		else
		{
			Adapter.DeleteCommand.Parameters[111].Value = 0;
			Adapter.DeleteCommand.Parameters[112].Value = Original_Text7;
		}
		if (Original_TaxType.HasValue)
		{
			Adapter.DeleteCommand.Parameters[113].Value = 0;
			Adapter.DeleteCommand.Parameters[114].Value = Original_TaxType.Value;
		}
		else
		{
			Adapter.DeleteCommand.Parameters[113].Value = 1;
			Adapter.DeleteCommand.Parameters[114].Value = DBNull.Value;
		}
		if (Original_Tax.HasValue)
		{
			Adapter.DeleteCommand.Parameters[115].Value = 0;
			Adapter.DeleteCommand.Parameters[116].Value = Original_Tax.Value;
		}
		else
		{
			Adapter.DeleteCommand.Parameters[115].Value = 1;
			Adapter.DeleteCommand.Parameters[116].Value = DBNull.Value;
		}
		if (Original_SspValue1.HasValue)
		{
			Adapter.DeleteCommand.Parameters[117].Value = 0;
			Adapter.DeleteCommand.Parameters[118].Value = Original_SspValue1.Value;
		}
		else
		{
			Adapter.DeleteCommand.Parameters[117].Value = 1;
			Adapter.DeleteCommand.Parameters[118].Value = DBNull.Value;
		}
		if (Original_SspValue2.HasValue)
		{
			Adapter.DeleteCommand.Parameters[119].Value = 0;
			Adapter.DeleteCommand.Parameters[120].Value = Original_SspValue2.Value;
		}
		else
		{
			Adapter.DeleteCommand.Parameters[119].Value = 1;
			Adapter.DeleteCommand.Parameters[120].Value = DBNull.Value;
		}
		if (Original_SspValue3.HasValue)
		{
			Adapter.DeleteCommand.Parameters[121].Value = 0;
			Adapter.DeleteCommand.Parameters[122].Value = Original_SspValue3.Value;
		}
		else
		{
			Adapter.DeleteCommand.Parameters[121].Value = 1;
			Adapter.DeleteCommand.Parameters[122].Value = DBNull.Value;
		}
		if (Original_SspValue4.HasValue)
		{
			Adapter.DeleteCommand.Parameters[123].Value = 0;
			Adapter.DeleteCommand.Parameters[124].Value = Original_SspValue4.Value;
		}
		else
		{
			Adapter.DeleteCommand.Parameters[123].Value = 1;
			Adapter.DeleteCommand.Parameters[124].Value = DBNull.Value;
		}
		if (Original_SType.HasValue)
		{
			Adapter.DeleteCommand.Parameters[125].Value = 0;
			Adapter.DeleteCommand.Parameters[126].Value = Original_SType.Value;
		}
		else
		{
			Adapter.DeleteCommand.Parameters[125].Value = 1;
			Adapter.DeleteCommand.Parameters[126].Value = DBNull.Value;
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
	[DataObjectMethod(DataObjectMethodType.Insert, true)]
	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	[HelpKeyword("vs.data.TableAdapter")]
	public virtual int Insert(int? PLUID, bool Valid, int? Remark, string Index, int? UnitID, decimal? Price, decimal? Cost, decimal? Tare, int? BarF1, int? BarF2, int? BarT1, int? BarT2, int? LabelID1, int? LabelID2, int? ClassID, int? PS_SD, int? PS_ST, int? PS_PD, int? PS_PT, int? PS_UD, int? PC_SD, int? PC_ST, int? PC_PD, int? PC_PT, int? PC_UD, int? DF_U, int? DF_D, decimal? DF_UN, decimal? DF_DN, int? DA_Sort1, int? DA_Day1, decimal? DA_Up1, decimal? DA_Dn1, decimal? DA_Num1, int? DA_Sort2, int? DA_Day2, decimal? DA_Up2, decimal? DA_Dn2, decimal? DA_Num2, int? DA_Sort3, int? DA_Day3, decimal? DA_Up3, decimal? DA_Dn3, decimal? DA_Num3, int? DA_Sort4, int? DA_Day4, decimal? DA_Up4, decimal? DA_Dn4, decimal? DA_Num4, string Name, string Text1, string Text2, string Text3, string Text4, string Text5, string Text6, string Text7, int? TaxType, int? Tax, int? SspValue1, int? SspValue2, int? SspValue3, int? SspValue4, int? SType)
	{
		if (PLUID.HasValue)
		{
			Adapter.InsertCommand.Parameters[0].Value = PLUID.Value;
		}
		else
		{
			Adapter.InsertCommand.Parameters[0].Value = DBNull.Value;
		}
		Adapter.InsertCommand.Parameters[1].Value = Valid;
		if (Remark.HasValue)
		{
			Adapter.InsertCommand.Parameters[2].Value = Remark.Value;
		}
		else
		{
			Adapter.InsertCommand.Parameters[2].Value = DBNull.Value;
		}
		if (Index == null)
		{
			Adapter.InsertCommand.Parameters[3].Value = DBNull.Value;
		}
		else
		{
			Adapter.InsertCommand.Parameters[3].Value = Index;
		}
		if (UnitID.HasValue)
		{
			Adapter.InsertCommand.Parameters[4].Value = UnitID.Value;
		}
		else
		{
			Adapter.InsertCommand.Parameters[4].Value = DBNull.Value;
		}
		if (Price.HasValue)
		{
			Adapter.InsertCommand.Parameters[5].Value = Price.Value;
		}
		else
		{
			Adapter.InsertCommand.Parameters[5].Value = DBNull.Value;
		}
		if (Cost.HasValue)
		{
			Adapter.InsertCommand.Parameters[6].Value = Cost.Value;
		}
		else
		{
			Adapter.InsertCommand.Parameters[6].Value = DBNull.Value;
		}
		if (Tare.HasValue)
		{
			Adapter.InsertCommand.Parameters[7].Value = Tare.Value;
		}
		else
		{
			Adapter.InsertCommand.Parameters[7].Value = DBNull.Value;
		}
		if (BarF1.HasValue)
		{
			Adapter.InsertCommand.Parameters[8].Value = BarF1.Value;
		}
		else
		{
			Adapter.InsertCommand.Parameters[8].Value = DBNull.Value;
		}
		if (BarF2.HasValue)
		{
			Adapter.InsertCommand.Parameters[9].Value = BarF2.Value;
		}
		else
		{
			Adapter.InsertCommand.Parameters[9].Value = DBNull.Value;
		}
		if (BarT1.HasValue)
		{
			Adapter.InsertCommand.Parameters[10].Value = BarT1.Value;
		}
		else
		{
			Adapter.InsertCommand.Parameters[10].Value = DBNull.Value;
		}
		if (BarT2.HasValue)
		{
			Adapter.InsertCommand.Parameters[11].Value = BarT2.Value;
		}
		else
		{
			Adapter.InsertCommand.Parameters[11].Value = DBNull.Value;
		}
		if (LabelID1.HasValue)
		{
			Adapter.InsertCommand.Parameters[12].Value = LabelID1.Value;
		}
		else
		{
			Adapter.InsertCommand.Parameters[12].Value = DBNull.Value;
		}
		if (LabelID2.HasValue)
		{
			Adapter.InsertCommand.Parameters[13].Value = LabelID2.Value;
		}
		else
		{
			Adapter.InsertCommand.Parameters[13].Value = DBNull.Value;
		}
		if (ClassID.HasValue)
		{
			Adapter.InsertCommand.Parameters[14].Value = ClassID.Value;
		}
		else
		{
			Adapter.InsertCommand.Parameters[14].Value = DBNull.Value;
		}
		if (PS_SD.HasValue)
		{
			Adapter.InsertCommand.Parameters[15].Value = PS_SD.Value;
		}
		else
		{
			Adapter.InsertCommand.Parameters[15].Value = DBNull.Value;
		}
		if (PS_ST.HasValue)
		{
			Adapter.InsertCommand.Parameters[16].Value = PS_ST.Value;
		}
		else
		{
			Adapter.InsertCommand.Parameters[16].Value = DBNull.Value;
		}
		if (PS_PD.HasValue)
		{
			Adapter.InsertCommand.Parameters[17].Value = PS_PD.Value;
		}
		else
		{
			Adapter.InsertCommand.Parameters[17].Value = DBNull.Value;
		}
		if (PS_PT.HasValue)
		{
			Adapter.InsertCommand.Parameters[18].Value = PS_PT.Value;
		}
		else
		{
			Adapter.InsertCommand.Parameters[18].Value = DBNull.Value;
		}
		if (PS_UD.HasValue)
		{
			Adapter.InsertCommand.Parameters[19].Value = PS_UD.Value;
		}
		else
		{
			Adapter.InsertCommand.Parameters[19].Value = DBNull.Value;
		}
		if (PC_SD.HasValue)
		{
			Adapter.InsertCommand.Parameters[20].Value = PC_SD.Value;
		}
		else
		{
			Adapter.InsertCommand.Parameters[20].Value = DBNull.Value;
		}
		if (PC_ST.HasValue)
		{
			Adapter.InsertCommand.Parameters[21].Value = PC_ST.Value;
		}
		else
		{
			Adapter.InsertCommand.Parameters[21].Value = DBNull.Value;
		}
		if (PC_PD.HasValue)
		{
			Adapter.InsertCommand.Parameters[22].Value = PC_PD.Value;
		}
		else
		{
			Adapter.InsertCommand.Parameters[22].Value = DBNull.Value;
		}
		if (PC_PT.HasValue)
		{
			Adapter.InsertCommand.Parameters[23].Value = PC_PT.Value;
		}
		else
		{
			Adapter.InsertCommand.Parameters[23].Value = DBNull.Value;
		}
		if (PC_UD.HasValue)
		{
			Adapter.InsertCommand.Parameters[24].Value = PC_UD.Value;
		}
		else
		{
			Adapter.InsertCommand.Parameters[24].Value = DBNull.Value;
		}
		if (DF_U.HasValue)
		{
			Adapter.InsertCommand.Parameters[25].Value = DF_U.Value;
		}
		else
		{
			Adapter.InsertCommand.Parameters[25].Value = DBNull.Value;
		}
		if (DF_D.HasValue)
		{
			Adapter.InsertCommand.Parameters[26].Value = DF_D.Value;
		}
		else
		{
			Adapter.InsertCommand.Parameters[26].Value = DBNull.Value;
		}
		if (DF_UN.HasValue)
		{
			Adapter.InsertCommand.Parameters[27].Value = DF_UN.Value;
		}
		else
		{
			Adapter.InsertCommand.Parameters[27].Value = DBNull.Value;
		}
		if (DF_DN.HasValue)
		{
			Adapter.InsertCommand.Parameters[28].Value = DF_DN.Value;
		}
		else
		{
			Adapter.InsertCommand.Parameters[28].Value = DBNull.Value;
		}
		if (DA_Sort1.HasValue)
		{
			Adapter.InsertCommand.Parameters[29].Value = DA_Sort1.Value;
		}
		else
		{
			Adapter.InsertCommand.Parameters[29].Value = DBNull.Value;
		}
		if (DA_Day1.HasValue)
		{
			Adapter.InsertCommand.Parameters[30].Value = DA_Day1.Value;
		}
		else
		{
			Adapter.InsertCommand.Parameters[30].Value = DBNull.Value;
		}
		if (DA_Up1.HasValue)
		{
			Adapter.InsertCommand.Parameters[31].Value = DA_Up1.Value;
		}
		else
		{
			Adapter.InsertCommand.Parameters[31].Value = DBNull.Value;
		}
		if (DA_Dn1.HasValue)
		{
			Adapter.InsertCommand.Parameters[32].Value = DA_Dn1.Value;
		}
		else
		{
			Adapter.InsertCommand.Parameters[32].Value = DBNull.Value;
		}
		if (DA_Num1.HasValue)
		{
			Adapter.InsertCommand.Parameters[33].Value = DA_Num1.Value;
		}
		else
		{
			Adapter.InsertCommand.Parameters[33].Value = DBNull.Value;
		}
		if (DA_Sort2.HasValue)
		{
			Adapter.InsertCommand.Parameters[34].Value = DA_Sort2.Value;
		}
		else
		{
			Adapter.InsertCommand.Parameters[34].Value = DBNull.Value;
		}
		if (DA_Day2.HasValue)
		{
			Adapter.InsertCommand.Parameters[35].Value = DA_Day2.Value;
		}
		else
		{
			Adapter.InsertCommand.Parameters[35].Value = DBNull.Value;
		}
		if (DA_Up2.HasValue)
		{
			Adapter.InsertCommand.Parameters[36].Value = DA_Up2.Value;
		}
		else
		{
			Adapter.InsertCommand.Parameters[36].Value = DBNull.Value;
		}
		if (DA_Dn2.HasValue)
		{
			Adapter.InsertCommand.Parameters[37].Value = DA_Dn2.Value;
		}
		else
		{
			Adapter.InsertCommand.Parameters[37].Value = DBNull.Value;
		}
		if (DA_Num2.HasValue)
		{
			Adapter.InsertCommand.Parameters[38].Value = DA_Num2.Value;
		}
		else
		{
			Adapter.InsertCommand.Parameters[38].Value = DBNull.Value;
		}
		if (DA_Sort3.HasValue)
		{
			Adapter.InsertCommand.Parameters[39].Value = DA_Sort3.Value;
		}
		else
		{
			Adapter.InsertCommand.Parameters[39].Value = DBNull.Value;
		}
		if (DA_Day3.HasValue)
		{
			Adapter.InsertCommand.Parameters[40].Value = DA_Day3.Value;
		}
		else
		{
			Adapter.InsertCommand.Parameters[40].Value = DBNull.Value;
		}
		if (DA_Up3.HasValue)
		{
			Adapter.InsertCommand.Parameters[41].Value = DA_Up3.Value;
		}
		else
		{
			Adapter.InsertCommand.Parameters[41].Value = DBNull.Value;
		}
		if (DA_Dn3.HasValue)
		{
			Adapter.InsertCommand.Parameters[42].Value = DA_Dn3.Value;
		}
		else
		{
			Adapter.InsertCommand.Parameters[42].Value = DBNull.Value;
		}
		if (DA_Num3.HasValue)
		{
			Adapter.InsertCommand.Parameters[43].Value = DA_Num3.Value;
		}
		else
		{
			Adapter.InsertCommand.Parameters[43].Value = DBNull.Value;
		}
		if (DA_Sort4.HasValue)
		{
			Adapter.InsertCommand.Parameters[44].Value = DA_Sort4.Value;
		}
		else
		{
			Adapter.InsertCommand.Parameters[44].Value = DBNull.Value;
		}
		if (DA_Day4.HasValue)
		{
			Adapter.InsertCommand.Parameters[45].Value = DA_Day4.Value;
		}
		else
		{
			Adapter.InsertCommand.Parameters[45].Value = DBNull.Value;
		}
		if (DA_Up4.HasValue)
		{
			Adapter.InsertCommand.Parameters[46].Value = DA_Up4.Value;
		}
		else
		{
			Adapter.InsertCommand.Parameters[46].Value = DBNull.Value;
		}
		if (DA_Dn4.HasValue)
		{
			Adapter.InsertCommand.Parameters[47].Value = DA_Dn4.Value;
		}
		else
		{
			Adapter.InsertCommand.Parameters[47].Value = DBNull.Value;
		}
		if (DA_Num4.HasValue)
		{
			Adapter.InsertCommand.Parameters[48].Value = DA_Num4.Value;
		}
		else
		{
			Adapter.InsertCommand.Parameters[48].Value = DBNull.Value;
		}
		if (Name == null)
		{
			Adapter.InsertCommand.Parameters[49].Value = DBNull.Value;
		}
		else
		{
			Adapter.InsertCommand.Parameters[49].Value = Name;
		}
		if (Text1 == null)
		{
			Adapter.InsertCommand.Parameters[50].Value = DBNull.Value;
		}
		else
		{
			Adapter.InsertCommand.Parameters[50].Value = Text1;
		}
		if (Text2 == null)
		{
			Adapter.InsertCommand.Parameters[51].Value = DBNull.Value;
		}
		else
		{
			Adapter.InsertCommand.Parameters[51].Value = Text2;
		}
		if (Text3 == null)
		{
			Adapter.InsertCommand.Parameters[52].Value = DBNull.Value;
		}
		else
		{
			Adapter.InsertCommand.Parameters[52].Value = Text3;
		}
		if (Text4 == null)
		{
			Adapter.InsertCommand.Parameters[53].Value = DBNull.Value;
		}
		else
		{
			Adapter.InsertCommand.Parameters[53].Value = Text4;
		}
		if (Text5 == null)
		{
			Adapter.InsertCommand.Parameters[54].Value = DBNull.Value;
		}
		else
		{
			Adapter.InsertCommand.Parameters[54].Value = Text5;
		}
		if (Text6 == null)
		{
			Adapter.InsertCommand.Parameters[55].Value = DBNull.Value;
		}
		else
		{
			Adapter.InsertCommand.Parameters[55].Value = Text6;
		}
		if (Text7 == null)
		{
			Adapter.InsertCommand.Parameters[56].Value = DBNull.Value;
		}
		else
		{
			Adapter.InsertCommand.Parameters[56].Value = Text7;
		}
		if (TaxType.HasValue)
		{
			Adapter.InsertCommand.Parameters[57].Value = TaxType.Value;
		}
		else
		{
			Adapter.InsertCommand.Parameters[57].Value = DBNull.Value;
		}
		if (Tax.HasValue)
		{
			Adapter.InsertCommand.Parameters[58].Value = Tax.Value;
		}
		else
		{
			Adapter.InsertCommand.Parameters[58].Value = DBNull.Value;
		}
		if (SspValue1.HasValue)
		{
			Adapter.InsertCommand.Parameters[59].Value = SspValue1.Value;
		}
		else
		{
			Adapter.InsertCommand.Parameters[59].Value = DBNull.Value;
		}
		if (SspValue2.HasValue)
		{
			Adapter.InsertCommand.Parameters[60].Value = SspValue2.Value;
		}
		else
		{
			Adapter.InsertCommand.Parameters[60].Value = DBNull.Value;
		}
		if (SspValue3.HasValue)
		{
			Adapter.InsertCommand.Parameters[61].Value = SspValue3.Value;
		}
		else
		{
			Adapter.InsertCommand.Parameters[61].Value = DBNull.Value;
		}
		if (SspValue4.HasValue)
		{
			Adapter.InsertCommand.Parameters[62].Value = SspValue4.Value;
		}
		else
		{
			Adapter.InsertCommand.Parameters[62].Value = DBNull.Value;
		}
		if (SType.HasValue)
		{
			Adapter.InsertCommand.Parameters[63].Value = SType.Value;
		}
		else
		{
			Adapter.InsertCommand.Parameters[63].Value = DBNull.Value;
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

	[HelpKeyword("vs.data.TableAdapter")]
	[DebuggerNonUserCode]
	[DataObjectMethod(DataObjectMethodType.Update, true)]
	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	public virtual int Update(int? PLUID, bool Valid, int? Remark, string Index, int? UnitID, decimal? Price, decimal? Cost, decimal? Tare, int? BarF1, int? BarF2, int? BarT1, int? BarT2, int? LabelID1, int? LabelID2, int? ClassID, int? PS_SD, int? PS_ST, int? PS_PD, int? PS_PT, int? PS_UD, int? PC_SD, int? PC_ST, int? PC_PD, int? PC_PT, int? PC_UD, int? DF_U, int? DF_D, decimal? DF_UN, decimal? DF_DN, int? DA_Sort1, int? DA_Day1, decimal? DA_Up1, decimal? DA_Dn1, decimal? DA_Num1, int? DA_Sort2, int? DA_Day2, decimal? DA_Up2, decimal? DA_Dn2, decimal? DA_Num2, int? DA_Sort3, int? DA_Day3, decimal? DA_Up3, decimal? DA_Dn3, decimal? DA_Num3, int? DA_Sort4, int? DA_Day4, decimal? DA_Up4, decimal? DA_Dn4, decimal? DA_Num4, string Name, string Text1, string Text2, string Text3, string Text4, string Text5, string Text6, string Text7, int? TaxType, int? Tax, int? SspValue1, int? SspValue2, int? SspValue3, int? SspValue4, int? SType, int? Original_PLUID, bool Original_Valid, int? Original_Remark, string Original_Index, int? Original_UnitID, decimal? Original_Price, decimal? Original_Cost, decimal? Original_Tare, int? Original_BarF1, int? Original_BarF2, int? Original_BarT1, int? Original_BarT2, int? Original_LabelID1, int? Original_LabelID2, int? Original_ClassID, int? Original_PS_SD, int? Original_PS_ST, int? Original_PS_PD, int? Original_PS_PT, int? Original_PS_UD, int? Original_PC_SD, int? Original_PC_ST, int? Original_PC_PD, int? Original_PC_PT, int? Original_PC_UD, int? Original_DF_U, int? Original_DF_D, decimal? Original_DF_UN, decimal? Original_DF_DN, int? Original_DA_Sort1, int? Original_DA_Day1, decimal? Original_DA_Up1, decimal? Original_DA_Dn1, decimal? Original_DA_Num1, int? Original_DA_Sort2, int? Original_DA_Day2, decimal? Original_DA_Up2, decimal? Original_DA_Dn2, decimal? Original_DA_Num2, int? Original_DA_Sort3, int? Original_DA_Day3, decimal? Original_DA_Up3, decimal? Original_DA_Dn3, decimal? Original_DA_Num3, int? Original_DA_Sort4, int? Original_DA_Day4, decimal? Original_DA_Up4, decimal? Original_DA_Dn4, decimal? Original_DA_Num4, string Original_Name, string Original_Text1, string Original_Text2, string Original_Text3, string Original_Text4, string Original_Text5, string Original_Text6, string Original_Text7, int? Original_TaxType, int? Original_Tax, int? Original_SspValue1, int? Original_SspValue2, int? Original_SspValue3, int? Original_SspValue4, int? Original_SType)
	{
		if (PLUID.HasValue)
		{
			Adapter.UpdateCommand.Parameters[0].Value = PLUID.Value;
		}
		else
		{
			Adapter.UpdateCommand.Parameters[0].Value = DBNull.Value;
		}
		Adapter.UpdateCommand.Parameters[1].Value = Valid;
		if (Remark.HasValue)
		{
			Adapter.UpdateCommand.Parameters[2].Value = Remark.Value;
		}
		else
		{
			Adapter.UpdateCommand.Parameters[2].Value = DBNull.Value;
		}
		if (Index == null)
		{
			Adapter.UpdateCommand.Parameters[3].Value = DBNull.Value;
		}
		else
		{
			Adapter.UpdateCommand.Parameters[3].Value = Index;
		}
		if (UnitID.HasValue)
		{
			Adapter.UpdateCommand.Parameters[4].Value = UnitID.Value;
		}
		else
		{
			Adapter.UpdateCommand.Parameters[4].Value = DBNull.Value;
		}
		if (Price.HasValue)
		{
			Adapter.UpdateCommand.Parameters[5].Value = Price.Value;
		}
		else
		{
			Adapter.UpdateCommand.Parameters[5].Value = DBNull.Value;
		}
		if (Cost.HasValue)
		{
			Adapter.UpdateCommand.Parameters[6].Value = Cost.Value;
		}
		else
		{
			Adapter.UpdateCommand.Parameters[6].Value = DBNull.Value;
		}
		if (Tare.HasValue)
		{
			Adapter.UpdateCommand.Parameters[7].Value = Tare.Value;
		}
		else
		{
			Adapter.UpdateCommand.Parameters[7].Value = DBNull.Value;
		}
		if (BarF1.HasValue)
		{
			Adapter.UpdateCommand.Parameters[8].Value = BarF1.Value;
		}
		else
		{
			Adapter.UpdateCommand.Parameters[8].Value = DBNull.Value;
		}
		if (BarF2.HasValue)
		{
			Adapter.UpdateCommand.Parameters[9].Value = BarF2.Value;
		}
		else
		{
			Adapter.UpdateCommand.Parameters[9].Value = DBNull.Value;
		}
		if (BarT1.HasValue)
		{
			Adapter.UpdateCommand.Parameters[10].Value = BarT1.Value;
		}
		else
		{
			Adapter.UpdateCommand.Parameters[10].Value = DBNull.Value;
		}
		if (BarT2.HasValue)
		{
			Adapter.UpdateCommand.Parameters[11].Value = BarT2.Value;
		}
		else
		{
			Adapter.UpdateCommand.Parameters[11].Value = DBNull.Value;
		}
		if (LabelID1.HasValue)
		{
			Adapter.UpdateCommand.Parameters[12].Value = LabelID1.Value;
		}
		else
		{
			Adapter.UpdateCommand.Parameters[12].Value = DBNull.Value;
		}
		if (LabelID2.HasValue)
		{
			Adapter.UpdateCommand.Parameters[13].Value = LabelID2.Value;
		}
		else
		{
			Adapter.UpdateCommand.Parameters[13].Value = DBNull.Value;
		}
		if (ClassID.HasValue)
		{
			Adapter.UpdateCommand.Parameters[14].Value = ClassID.Value;
		}
		else
		{
			Adapter.UpdateCommand.Parameters[14].Value = DBNull.Value;
		}
		if (PS_SD.HasValue)
		{
			Adapter.UpdateCommand.Parameters[15].Value = PS_SD.Value;
		}
		else
		{
			Adapter.UpdateCommand.Parameters[15].Value = DBNull.Value;
		}
		if (PS_ST.HasValue)
		{
			Adapter.UpdateCommand.Parameters[16].Value = PS_ST.Value;
		}
		else
		{
			Adapter.UpdateCommand.Parameters[16].Value = DBNull.Value;
		}
		if (PS_PD.HasValue)
		{
			Adapter.UpdateCommand.Parameters[17].Value = PS_PD.Value;
		}
		else
		{
			Adapter.UpdateCommand.Parameters[17].Value = DBNull.Value;
		}
		if (PS_PT.HasValue)
		{
			Adapter.UpdateCommand.Parameters[18].Value = PS_PT.Value;
		}
		else
		{
			Adapter.UpdateCommand.Parameters[18].Value = DBNull.Value;
		}
		if (PS_UD.HasValue)
		{
			Adapter.UpdateCommand.Parameters[19].Value = PS_UD.Value;
		}
		else
		{
			Adapter.UpdateCommand.Parameters[19].Value = DBNull.Value;
		}
		if (PC_SD.HasValue)
		{
			Adapter.UpdateCommand.Parameters[20].Value = PC_SD.Value;
		}
		else
		{
			Adapter.UpdateCommand.Parameters[20].Value = DBNull.Value;
		}
		if (PC_ST.HasValue)
		{
			Adapter.UpdateCommand.Parameters[21].Value = PC_ST.Value;
		}
		else
		{
			Adapter.UpdateCommand.Parameters[21].Value = DBNull.Value;
		}
		if (PC_PD.HasValue)
		{
			Adapter.UpdateCommand.Parameters[22].Value = PC_PD.Value;
		}
		else
		{
			Adapter.UpdateCommand.Parameters[22].Value = DBNull.Value;
		}
		if (PC_PT.HasValue)
		{
			Adapter.UpdateCommand.Parameters[23].Value = PC_PT.Value;
		}
		else
		{
			Adapter.UpdateCommand.Parameters[23].Value = DBNull.Value;
		}
		if (PC_UD.HasValue)
		{
			Adapter.UpdateCommand.Parameters[24].Value = PC_UD.Value;
		}
		else
		{
			Adapter.UpdateCommand.Parameters[24].Value = DBNull.Value;
		}
		if (DF_U.HasValue)
		{
			Adapter.UpdateCommand.Parameters[25].Value = DF_U.Value;
		}
		else
		{
			Adapter.UpdateCommand.Parameters[25].Value = DBNull.Value;
		}
		if (DF_D.HasValue)
		{
			Adapter.UpdateCommand.Parameters[26].Value = DF_D.Value;
		}
		else
		{
			Adapter.UpdateCommand.Parameters[26].Value = DBNull.Value;
		}
		if (DF_UN.HasValue)
		{
			Adapter.UpdateCommand.Parameters[27].Value = DF_UN.Value;
		}
		else
		{
			Adapter.UpdateCommand.Parameters[27].Value = DBNull.Value;
		}
		if (DF_DN.HasValue)
		{
			Adapter.UpdateCommand.Parameters[28].Value = DF_DN.Value;
		}
		else
		{
			Adapter.UpdateCommand.Parameters[28].Value = DBNull.Value;
		}
		if (DA_Sort1.HasValue)
		{
			Adapter.UpdateCommand.Parameters[29].Value = DA_Sort1.Value;
		}
		else
		{
			Adapter.UpdateCommand.Parameters[29].Value = DBNull.Value;
		}
		if (DA_Day1.HasValue)
		{
			Adapter.UpdateCommand.Parameters[30].Value = DA_Day1.Value;
		}
		else
		{
			Adapter.UpdateCommand.Parameters[30].Value = DBNull.Value;
		}
		if (DA_Up1.HasValue)
		{
			Adapter.UpdateCommand.Parameters[31].Value = DA_Up1.Value;
		}
		else
		{
			Adapter.UpdateCommand.Parameters[31].Value = DBNull.Value;
		}
		if (DA_Dn1.HasValue)
		{
			Adapter.UpdateCommand.Parameters[32].Value = DA_Dn1.Value;
		}
		else
		{
			Adapter.UpdateCommand.Parameters[32].Value = DBNull.Value;
		}
		if (DA_Num1.HasValue)
		{
			Adapter.UpdateCommand.Parameters[33].Value = DA_Num1.Value;
		}
		else
		{
			Adapter.UpdateCommand.Parameters[33].Value = DBNull.Value;
		}
		if (DA_Sort2.HasValue)
		{
			Adapter.UpdateCommand.Parameters[34].Value = DA_Sort2.Value;
		}
		else
		{
			Adapter.UpdateCommand.Parameters[34].Value = DBNull.Value;
		}
		if (DA_Day2.HasValue)
		{
			Adapter.UpdateCommand.Parameters[35].Value = DA_Day2.Value;
		}
		else
		{
			Adapter.UpdateCommand.Parameters[35].Value = DBNull.Value;
		}
		if (DA_Up2.HasValue)
		{
			Adapter.UpdateCommand.Parameters[36].Value = DA_Up2.Value;
		}
		else
		{
			Adapter.UpdateCommand.Parameters[36].Value = DBNull.Value;
		}
		if (DA_Dn2.HasValue)
		{
			Adapter.UpdateCommand.Parameters[37].Value = DA_Dn2.Value;
		}
		else
		{
			Adapter.UpdateCommand.Parameters[37].Value = DBNull.Value;
		}
		if (DA_Num2.HasValue)
		{
			Adapter.UpdateCommand.Parameters[38].Value = DA_Num2.Value;
		}
		else
		{
			Adapter.UpdateCommand.Parameters[38].Value = DBNull.Value;
		}
		if (DA_Sort3.HasValue)
		{
			Adapter.UpdateCommand.Parameters[39].Value = DA_Sort3.Value;
		}
		else
		{
			Adapter.UpdateCommand.Parameters[39].Value = DBNull.Value;
		}
		if (DA_Day3.HasValue)
		{
			Adapter.UpdateCommand.Parameters[40].Value = DA_Day3.Value;
		}
		else
		{
			Adapter.UpdateCommand.Parameters[40].Value = DBNull.Value;
		}
		if (DA_Up3.HasValue)
		{
			Adapter.UpdateCommand.Parameters[41].Value = DA_Up3.Value;
		}
		else
		{
			Adapter.UpdateCommand.Parameters[41].Value = DBNull.Value;
		}
		if (DA_Dn3.HasValue)
		{
			Adapter.UpdateCommand.Parameters[42].Value = DA_Dn3.Value;
		}
		else
		{
			Adapter.UpdateCommand.Parameters[42].Value = DBNull.Value;
		}
		if (DA_Num3.HasValue)
		{
			Adapter.UpdateCommand.Parameters[43].Value = DA_Num3.Value;
		}
		else
		{
			Adapter.UpdateCommand.Parameters[43].Value = DBNull.Value;
		}
		if (DA_Sort4.HasValue)
		{
			Adapter.UpdateCommand.Parameters[44].Value = DA_Sort4.Value;
		}
		else
		{
			Adapter.UpdateCommand.Parameters[44].Value = DBNull.Value;
		}
		if (DA_Day4.HasValue)
		{
			Adapter.UpdateCommand.Parameters[45].Value = DA_Day4.Value;
		}
		else
		{
			Adapter.UpdateCommand.Parameters[45].Value = DBNull.Value;
		}
		if (DA_Up4.HasValue)
		{
			Adapter.UpdateCommand.Parameters[46].Value = DA_Up4.Value;
		}
		else
		{
			Adapter.UpdateCommand.Parameters[46].Value = DBNull.Value;
		}
		if (DA_Dn4.HasValue)
		{
			Adapter.UpdateCommand.Parameters[47].Value = DA_Dn4.Value;
		}
		else
		{
			Adapter.UpdateCommand.Parameters[47].Value = DBNull.Value;
		}
		if (DA_Num4.HasValue)
		{
			Adapter.UpdateCommand.Parameters[48].Value = DA_Num4.Value;
		}
		else
		{
			Adapter.UpdateCommand.Parameters[48].Value = DBNull.Value;
		}
		if (Name == null)
		{
			Adapter.UpdateCommand.Parameters[49].Value = DBNull.Value;
		}
		else
		{
			Adapter.UpdateCommand.Parameters[49].Value = Name;
		}
		if (Text1 == null)
		{
			Adapter.UpdateCommand.Parameters[50].Value = DBNull.Value;
		}
		else
		{
			Adapter.UpdateCommand.Parameters[50].Value = Text1;
		}
		if (Text2 == null)
		{
			Adapter.UpdateCommand.Parameters[51].Value = DBNull.Value;
		}
		else
		{
			Adapter.UpdateCommand.Parameters[51].Value = Text2;
		}
		if (Text3 == null)
		{
			Adapter.UpdateCommand.Parameters[52].Value = DBNull.Value;
		}
		else
		{
			Adapter.UpdateCommand.Parameters[52].Value = Text3;
		}
		if (Text4 == null)
		{
			Adapter.UpdateCommand.Parameters[53].Value = DBNull.Value;
		}
		else
		{
			Adapter.UpdateCommand.Parameters[53].Value = Text4;
		}
		if (Text5 == null)
		{
			Adapter.UpdateCommand.Parameters[54].Value = DBNull.Value;
		}
		else
		{
			Adapter.UpdateCommand.Parameters[54].Value = Text5;
		}
		if (Text6 == null)
		{
			Adapter.UpdateCommand.Parameters[55].Value = DBNull.Value;
		}
		else
		{
			Adapter.UpdateCommand.Parameters[55].Value = Text6;
		}
		if (Text7 == null)
		{
			Adapter.UpdateCommand.Parameters[56].Value = DBNull.Value;
		}
		else
		{
			Adapter.UpdateCommand.Parameters[56].Value = Text7;
		}
		if (TaxType.HasValue)
		{
			Adapter.UpdateCommand.Parameters[57].Value = TaxType.Value;
		}
		else
		{
			Adapter.UpdateCommand.Parameters[57].Value = DBNull.Value;
		}
		if (Tax.HasValue)
		{
			Adapter.UpdateCommand.Parameters[58].Value = Tax.Value;
		}
		else
		{
			Adapter.UpdateCommand.Parameters[58].Value = DBNull.Value;
		}
		if (SspValue1.HasValue)
		{
			Adapter.UpdateCommand.Parameters[59].Value = SspValue1.Value;
		}
		else
		{
			Adapter.UpdateCommand.Parameters[59].Value = DBNull.Value;
		}
		if (SspValue2.HasValue)
		{
			Adapter.UpdateCommand.Parameters[60].Value = SspValue2.Value;
		}
		else
		{
			Adapter.UpdateCommand.Parameters[60].Value = DBNull.Value;
		}
		if (SspValue3.HasValue)
		{
			Adapter.UpdateCommand.Parameters[61].Value = SspValue3.Value;
		}
		else
		{
			Adapter.UpdateCommand.Parameters[61].Value = DBNull.Value;
		}
		if (SspValue4.HasValue)
		{
			Adapter.UpdateCommand.Parameters[62].Value = SspValue4.Value;
		}
		else
		{
			Adapter.UpdateCommand.Parameters[62].Value = DBNull.Value;
		}
		if (SType.HasValue)
		{
			Adapter.UpdateCommand.Parameters[63].Value = SType.Value;
		}
		else
		{
			Adapter.UpdateCommand.Parameters[63].Value = DBNull.Value;
		}
		if (Original_PLUID.HasValue)
		{
			Adapter.UpdateCommand.Parameters[64].Value = Original_PLUID.Value;
		}
		else
		{
			Adapter.UpdateCommand.Parameters[64].Value = DBNull.Value;
		}
		Adapter.UpdateCommand.Parameters[65].Value = 0;
		Adapter.UpdateCommand.Parameters[66].Value = Original_Valid;
		if (Original_Remark.HasValue)
		{
			Adapter.UpdateCommand.Parameters[67].Value = 0;
			Adapter.UpdateCommand.Parameters[68].Value = Original_Remark.Value;
		}
		else
		{
			Adapter.UpdateCommand.Parameters[67].Value = 1;
			Adapter.UpdateCommand.Parameters[68].Value = DBNull.Value;
		}
		if (Original_Index == null)
		{
			Adapter.UpdateCommand.Parameters[69].Value = 1;
			Adapter.UpdateCommand.Parameters[70].Value = DBNull.Value;
		}
		else
		{
			Adapter.UpdateCommand.Parameters[69].Value = 0;
			Adapter.UpdateCommand.Parameters[70].Value = Original_Index;
		}
		if (Original_UnitID.HasValue)
		{
			Adapter.UpdateCommand.Parameters[71].Value = 0;
			Adapter.UpdateCommand.Parameters[72].Value = Original_UnitID.Value;
		}
		else
		{
			Adapter.UpdateCommand.Parameters[71].Value = 1;
			Adapter.UpdateCommand.Parameters[72].Value = DBNull.Value;
		}
		if (Original_Price.HasValue)
		{
			Adapter.UpdateCommand.Parameters[73].Value = 0;
			Adapter.UpdateCommand.Parameters[74].Value = Original_Price.Value;
		}
		else
		{
			Adapter.UpdateCommand.Parameters[73].Value = 1;
			Adapter.UpdateCommand.Parameters[74].Value = DBNull.Value;
		}
		if (Original_Cost.HasValue)
		{
			Adapter.UpdateCommand.Parameters[75].Value = 0;
			Adapter.UpdateCommand.Parameters[76].Value = Original_Cost.Value;
		}
		else
		{
			Adapter.UpdateCommand.Parameters[75].Value = 1;
			Adapter.UpdateCommand.Parameters[76].Value = DBNull.Value;
		}
		if (Original_Tare.HasValue)
		{
			Adapter.UpdateCommand.Parameters[77].Value = 0;
			Adapter.UpdateCommand.Parameters[78].Value = Original_Tare.Value;
		}
		else
		{
			Adapter.UpdateCommand.Parameters[77].Value = 1;
			Adapter.UpdateCommand.Parameters[78].Value = DBNull.Value;
		}
		if (Original_BarF1.HasValue)
		{
			Adapter.UpdateCommand.Parameters[79].Value = 0;
			Adapter.UpdateCommand.Parameters[80].Value = Original_BarF1.Value;
		}
		else
		{
			Adapter.UpdateCommand.Parameters[79].Value = 1;
			Adapter.UpdateCommand.Parameters[80].Value = DBNull.Value;
		}
		if (Original_BarF2.HasValue)
		{
			Adapter.UpdateCommand.Parameters[81].Value = 0;
			Adapter.UpdateCommand.Parameters[82].Value = Original_BarF2.Value;
		}
		else
		{
			Adapter.UpdateCommand.Parameters[81].Value = 1;
			Adapter.UpdateCommand.Parameters[82].Value = DBNull.Value;
		}
		if (Original_BarT1.HasValue)
		{
			Adapter.UpdateCommand.Parameters[83].Value = 0;
			Adapter.UpdateCommand.Parameters[84].Value = Original_BarT1.Value;
		}
		else
		{
			Adapter.UpdateCommand.Parameters[83].Value = 1;
			Adapter.UpdateCommand.Parameters[84].Value = DBNull.Value;
		}
		if (Original_BarT2.HasValue)
		{
			Adapter.UpdateCommand.Parameters[85].Value = 0;
			Adapter.UpdateCommand.Parameters[86].Value = Original_BarT2.Value;
		}
		else
		{
			Adapter.UpdateCommand.Parameters[85].Value = 1;
			Adapter.UpdateCommand.Parameters[86].Value = DBNull.Value;
		}
		if (Original_LabelID1.HasValue)
		{
			Adapter.UpdateCommand.Parameters[87].Value = 0;
			Adapter.UpdateCommand.Parameters[88].Value = Original_LabelID1.Value;
		}
		else
		{
			Adapter.UpdateCommand.Parameters[87].Value = 1;
			Adapter.UpdateCommand.Parameters[88].Value = DBNull.Value;
		}
		if (Original_LabelID2.HasValue)
		{
			Adapter.UpdateCommand.Parameters[89].Value = 0;
			Adapter.UpdateCommand.Parameters[90].Value = Original_LabelID2.Value;
		}
		else
		{
			Adapter.UpdateCommand.Parameters[89].Value = 1;
			Adapter.UpdateCommand.Parameters[90].Value = DBNull.Value;
		}
		if (Original_ClassID.HasValue)
		{
			Adapter.UpdateCommand.Parameters[91].Value = 0;
			Adapter.UpdateCommand.Parameters[92].Value = Original_ClassID.Value;
		}
		else
		{
			Adapter.UpdateCommand.Parameters[91].Value = 1;
			Adapter.UpdateCommand.Parameters[92].Value = DBNull.Value;
		}
		if (Original_PS_SD.HasValue)
		{
			Adapter.UpdateCommand.Parameters[93].Value = 0;
			Adapter.UpdateCommand.Parameters[94].Value = Original_PS_SD.Value;
		}
		else
		{
			Adapter.UpdateCommand.Parameters[93].Value = 1;
			Adapter.UpdateCommand.Parameters[94].Value = DBNull.Value;
		}
		if (Original_PS_ST.HasValue)
		{
			Adapter.UpdateCommand.Parameters[95].Value = 0;
			Adapter.UpdateCommand.Parameters[96].Value = Original_PS_ST.Value;
		}
		else
		{
			Adapter.UpdateCommand.Parameters[95].Value = 1;
			Adapter.UpdateCommand.Parameters[96].Value = DBNull.Value;
		}
		if (Original_PS_PD.HasValue)
		{
			Adapter.UpdateCommand.Parameters[97].Value = 0;
			Adapter.UpdateCommand.Parameters[98].Value = Original_PS_PD.Value;
		}
		else
		{
			Adapter.UpdateCommand.Parameters[97].Value = 1;
			Adapter.UpdateCommand.Parameters[98].Value = DBNull.Value;
		}
		if (Original_PS_PT.HasValue)
		{
			Adapter.UpdateCommand.Parameters[99].Value = 0;
			Adapter.UpdateCommand.Parameters[100].Value = Original_PS_PT.Value;
		}
		else
		{
			Adapter.UpdateCommand.Parameters[99].Value = 1;
			Adapter.UpdateCommand.Parameters[100].Value = DBNull.Value;
		}
		if (Original_PS_UD.HasValue)
		{
			Adapter.UpdateCommand.Parameters[101].Value = 0;
			Adapter.UpdateCommand.Parameters[102].Value = Original_PS_UD.Value;
		}
		else
		{
			Adapter.UpdateCommand.Parameters[101].Value = 1;
			Adapter.UpdateCommand.Parameters[102].Value = DBNull.Value;
		}
		if (Original_PC_SD.HasValue)
		{
			Adapter.UpdateCommand.Parameters[103].Value = 0;
			Adapter.UpdateCommand.Parameters[104].Value = Original_PC_SD.Value;
		}
		else
		{
			Adapter.UpdateCommand.Parameters[103].Value = 1;
			Adapter.UpdateCommand.Parameters[104].Value = DBNull.Value;
		}
		if (Original_PC_ST.HasValue)
		{
			Adapter.UpdateCommand.Parameters[105].Value = 0;
			Adapter.UpdateCommand.Parameters[106].Value = Original_PC_ST.Value;
		}
		else
		{
			Adapter.UpdateCommand.Parameters[105].Value = 1;
			Adapter.UpdateCommand.Parameters[106].Value = DBNull.Value;
		}
		if (Original_PC_PD.HasValue)
		{
			Adapter.UpdateCommand.Parameters[107].Value = 0;
			Adapter.UpdateCommand.Parameters[108].Value = Original_PC_PD.Value;
		}
		else
		{
			Adapter.UpdateCommand.Parameters[107].Value = 1;
			Adapter.UpdateCommand.Parameters[108].Value = DBNull.Value;
		}
		if (Original_PC_PT.HasValue)
		{
			Adapter.UpdateCommand.Parameters[109].Value = 0;
			Adapter.UpdateCommand.Parameters[110].Value = Original_PC_PT.Value;
		}
		else
		{
			Adapter.UpdateCommand.Parameters[109].Value = 1;
			Adapter.UpdateCommand.Parameters[110].Value = DBNull.Value;
		}
		if (Original_PC_UD.HasValue)
		{
			Adapter.UpdateCommand.Parameters[111].Value = 0;
			Adapter.UpdateCommand.Parameters[112].Value = Original_PC_UD.Value;
		}
		else
		{
			Adapter.UpdateCommand.Parameters[111].Value = 1;
			Adapter.UpdateCommand.Parameters[112].Value = DBNull.Value;
		}
		if (Original_DF_U.HasValue)
		{
			Adapter.UpdateCommand.Parameters[113].Value = 0;
			Adapter.UpdateCommand.Parameters[114].Value = Original_DF_U.Value;
		}
		else
		{
			Adapter.UpdateCommand.Parameters[113].Value = 1;
			Adapter.UpdateCommand.Parameters[114].Value = DBNull.Value;
		}
		if (Original_DF_D.HasValue)
		{
			Adapter.UpdateCommand.Parameters[115].Value = 0;
			Adapter.UpdateCommand.Parameters[116].Value = Original_DF_D.Value;
		}
		else
		{
			Adapter.UpdateCommand.Parameters[115].Value = 1;
			Adapter.UpdateCommand.Parameters[116].Value = DBNull.Value;
		}
		if (Original_DF_UN.HasValue)
		{
			Adapter.UpdateCommand.Parameters[117].Value = 0;
			Adapter.UpdateCommand.Parameters[118].Value = Original_DF_UN.Value;
		}
		else
		{
			Adapter.UpdateCommand.Parameters[117].Value = 1;
			Adapter.UpdateCommand.Parameters[118].Value = DBNull.Value;
		}
		if (Original_DF_DN.HasValue)
		{
			Adapter.UpdateCommand.Parameters[119].Value = 0;
			Adapter.UpdateCommand.Parameters[120].Value = Original_DF_DN.Value;
		}
		else
		{
			Adapter.UpdateCommand.Parameters[119].Value = 1;
			Adapter.UpdateCommand.Parameters[120].Value = DBNull.Value;
		}
		if (Original_DA_Sort1.HasValue)
		{
			Adapter.UpdateCommand.Parameters[121].Value = 0;
			Adapter.UpdateCommand.Parameters[122].Value = Original_DA_Sort1.Value;
		}
		else
		{
			Adapter.UpdateCommand.Parameters[121].Value = 1;
			Adapter.UpdateCommand.Parameters[122].Value = DBNull.Value;
		}
		if (Original_DA_Day1.HasValue)
		{
			Adapter.UpdateCommand.Parameters[123].Value = 0;
			Adapter.UpdateCommand.Parameters[124].Value = Original_DA_Day1.Value;
		}
		else
		{
			Adapter.UpdateCommand.Parameters[123].Value = 1;
			Adapter.UpdateCommand.Parameters[124].Value = DBNull.Value;
		}
		if (Original_DA_Up1.HasValue)
		{
			Adapter.UpdateCommand.Parameters[125].Value = 0;
			Adapter.UpdateCommand.Parameters[126].Value = Original_DA_Up1.Value;
		}
		else
		{
			Adapter.UpdateCommand.Parameters[125].Value = 1;
			Adapter.UpdateCommand.Parameters[126].Value = DBNull.Value;
		}
		if (Original_DA_Dn1.HasValue)
		{
			Adapter.UpdateCommand.Parameters[127].Value = 0;
			Adapter.UpdateCommand.Parameters[128].Value = Original_DA_Dn1.Value;
		}
		else
		{
			Adapter.UpdateCommand.Parameters[127].Value = 1;
			Adapter.UpdateCommand.Parameters[128].Value = DBNull.Value;
		}
		if (Original_DA_Num1.HasValue)
		{
			Adapter.UpdateCommand.Parameters[129].Value = 0;
			Adapter.UpdateCommand.Parameters[130].Value = Original_DA_Num1.Value;
		}
		else
		{
			Adapter.UpdateCommand.Parameters[129].Value = 1;
			Adapter.UpdateCommand.Parameters[130].Value = DBNull.Value;
		}
		if (Original_DA_Sort2.HasValue)
		{
			Adapter.UpdateCommand.Parameters[131].Value = 0;
			Adapter.UpdateCommand.Parameters[132].Value = Original_DA_Sort2.Value;
		}
		else
		{
			Adapter.UpdateCommand.Parameters[131].Value = 1;
			Adapter.UpdateCommand.Parameters[132].Value = DBNull.Value;
		}
		if (Original_DA_Day2.HasValue)
		{
			Adapter.UpdateCommand.Parameters[133].Value = 0;
			Adapter.UpdateCommand.Parameters[134].Value = Original_DA_Day2.Value;
		}
		else
		{
			Adapter.UpdateCommand.Parameters[133].Value = 1;
			Adapter.UpdateCommand.Parameters[134].Value = DBNull.Value;
		}
		if (Original_DA_Up2.HasValue)
		{
			Adapter.UpdateCommand.Parameters[135].Value = 0;
			Adapter.UpdateCommand.Parameters[136].Value = Original_DA_Up2.Value;
		}
		else
		{
			Adapter.UpdateCommand.Parameters[135].Value = 1;
			Adapter.UpdateCommand.Parameters[136].Value = DBNull.Value;
		}
		if (Original_DA_Dn2.HasValue)
		{
			Adapter.UpdateCommand.Parameters[137].Value = 0;
			Adapter.UpdateCommand.Parameters[138].Value = Original_DA_Dn2.Value;
		}
		else
		{
			Adapter.UpdateCommand.Parameters[137].Value = 1;
			Adapter.UpdateCommand.Parameters[138].Value = DBNull.Value;
		}
		if (Original_DA_Num2.HasValue)
		{
			Adapter.UpdateCommand.Parameters[139].Value = 0;
			Adapter.UpdateCommand.Parameters[140].Value = Original_DA_Num2.Value;
		}
		else
		{
			Adapter.UpdateCommand.Parameters[139].Value = 1;
			Adapter.UpdateCommand.Parameters[140].Value = DBNull.Value;
		}
		if (Original_DA_Sort3.HasValue)
		{
			Adapter.UpdateCommand.Parameters[141].Value = 0;
			Adapter.UpdateCommand.Parameters[142].Value = Original_DA_Sort3.Value;
		}
		else
		{
			Adapter.UpdateCommand.Parameters[141].Value = 1;
			Adapter.UpdateCommand.Parameters[142].Value = DBNull.Value;
		}
		if (Original_DA_Day3.HasValue)
		{
			Adapter.UpdateCommand.Parameters[143].Value = 0;
			Adapter.UpdateCommand.Parameters[144].Value = Original_DA_Day3.Value;
		}
		else
		{
			Adapter.UpdateCommand.Parameters[143].Value = 1;
			Adapter.UpdateCommand.Parameters[144].Value = DBNull.Value;
		}
		if (Original_DA_Up3.HasValue)
		{
			Adapter.UpdateCommand.Parameters[145].Value = 0;
			Adapter.UpdateCommand.Parameters[146].Value = Original_DA_Up3.Value;
		}
		else
		{
			Adapter.UpdateCommand.Parameters[145].Value = 1;
			Adapter.UpdateCommand.Parameters[146].Value = DBNull.Value;
		}
		if (Original_DA_Dn3.HasValue)
		{
			Adapter.UpdateCommand.Parameters[147].Value = 0;
			Adapter.UpdateCommand.Parameters[148].Value = Original_DA_Dn3.Value;
		}
		else
		{
			Adapter.UpdateCommand.Parameters[147].Value = 1;
			Adapter.UpdateCommand.Parameters[148].Value = DBNull.Value;
		}
		if (Original_DA_Num3.HasValue)
		{
			Adapter.UpdateCommand.Parameters[149].Value = 0;
			Adapter.UpdateCommand.Parameters[150].Value = Original_DA_Num3.Value;
		}
		else
		{
			Adapter.UpdateCommand.Parameters[149].Value = 1;
			Adapter.UpdateCommand.Parameters[150].Value = DBNull.Value;
		}
		if (Original_DA_Sort4.HasValue)
		{
			Adapter.UpdateCommand.Parameters[151].Value = 0;
			Adapter.UpdateCommand.Parameters[152].Value = Original_DA_Sort4.Value;
		}
		else
		{
			Adapter.UpdateCommand.Parameters[151].Value = 1;
			Adapter.UpdateCommand.Parameters[152].Value = DBNull.Value;
		}
		if (Original_DA_Day4.HasValue)
		{
			Adapter.UpdateCommand.Parameters[153].Value = 0;
			Adapter.UpdateCommand.Parameters[154].Value = Original_DA_Day4.Value;
		}
		else
		{
			Adapter.UpdateCommand.Parameters[153].Value = 1;
			Adapter.UpdateCommand.Parameters[154].Value = DBNull.Value;
		}
		if (Original_DA_Up4.HasValue)
		{
			Adapter.UpdateCommand.Parameters[155].Value = 0;
			Adapter.UpdateCommand.Parameters[156].Value = Original_DA_Up4.Value;
		}
		else
		{
			Adapter.UpdateCommand.Parameters[155].Value = 1;
			Adapter.UpdateCommand.Parameters[156].Value = DBNull.Value;
		}
		if (Original_DA_Dn4.HasValue)
		{
			Adapter.UpdateCommand.Parameters[157].Value = 0;
			Adapter.UpdateCommand.Parameters[158].Value = Original_DA_Dn4.Value;
		}
		else
		{
			Adapter.UpdateCommand.Parameters[157].Value = 1;
			Adapter.UpdateCommand.Parameters[158].Value = DBNull.Value;
		}
		if (Original_DA_Num4.HasValue)
		{
			Adapter.UpdateCommand.Parameters[159].Value = 0;
			Adapter.UpdateCommand.Parameters[160].Value = Original_DA_Num4.Value;
		}
		else
		{
			Adapter.UpdateCommand.Parameters[159].Value = 1;
			Adapter.UpdateCommand.Parameters[160].Value = DBNull.Value;
		}
		if (Original_Name == null)
		{
			Adapter.UpdateCommand.Parameters[161].Value = 1;
			Adapter.UpdateCommand.Parameters[162].Value = DBNull.Value;
		}
		else
		{
			Adapter.UpdateCommand.Parameters[161].Value = 0;
			Adapter.UpdateCommand.Parameters[162].Value = Original_Name;
		}
		if (Original_Text1 == null)
		{
			Adapter.UpdateCommand.Parameters[163].Value = 1;
			Adapter.UpdateCommand.Parameters[164].Value = DBNull.Value;
		}
		else
		{
			Adapter.UpdateCommand.Parameters[163].Value = 0;
			Adapter.UpdateCommand.Parameters[164].Value = Original_Text1;
		}
		if (Original_Text2 == null)
		{
			Adapter.UpdateCommand.Parameters[165].Value = 1;
			Adapter.UpdateCommand.Parameters[166].Value = DBNull.Value;
		}
		else
		{
			Adapter.UpdateCommand.Parameters[165].Value = 0;
			Adapter.UpdateCommand.Parameters[166].Value = Original_Text2;
		}
		if (Original_Text3 == null)
		{
			Adapter.UpdateCommand.Parameters[167].Value = 1;
			Adapter.UpdateCommand.Parameters[168].Value = DBNull.Value;
		}
		else
		{
			Adapter.UpdateCommand.Parameters[167].Value = 0;
			Adapter.UpdateCommand.Parameters[168].Value = Original_Text3;
		}
		if (Original_Text4 == null)
		{
			Adapter.UpdateCommand.Parameters[169].Value = 1;
			Adapter.UpdateCommand.Parameters[170].Value = DBNull.Value;
		}
		else
		{
			Adapter.UpdateCommand.Parameters[169].Value = 0;
			Adapter.UpdateCommand.Parameters[170].Value = Original_Text4;
		}
		if (Original_Text5 == null)
		{
			Adapter.UpdateCommand.Parameters[171].Value = 1;
			Adapter.UpdateCommand.Parameters[172].Value = DBNull.Value;
		}
		else
		{
			Adapter.UpdateCommand.Parameters[171].Value = 0;
			Adapter.UpdateCommand.Parameters[172].Value = Original_Text5;
		}
		if (Original_Text6 == null)
		{
			Adapter.UpdateCommand.Parameters[173].Value = 1;
			Adapter.UpdateCommand.Parameters[174].Value = DBNull.Value;
		}
		else
		{
			Adapter.UpdateCommand.Parameters[173].Value = 0;
			Adapter.UpdateCommand.Parameters[174].Value = Original_Text6;
		}
		if (Original_Text7 == null)
		{
			Adapter.UpdateCommand.Parameters[175].Value = 1;
			Adapter.UpdateCommand.Parameters[176].Value = DBNull.Value;
		}
		else
		{
			Adapter.UpdateCommand.Parameters[175].Value = 0;
			Adapter.UpdateCommand.Parameters[176].Value = Original_Text7;
		}
		if (Original_TaxType.HasValue)
		{
			Adapter.UpdateCommand.Parameters[177].Value = 0;
			Adapter.UpdateCommand.Parameters[178].Value = Original_TaxType.Value;
		}
		else
		{
			Adapter.UpdateCommand.Parameters[177].Value = 1;
			Adapter.UpdateCommand.Parameters[178].Value = DBNull.Value;
		}
		if (Original_Tax.HasValue)
		{
			Adapter.UpdateCommand.Parameters[179].Value = 0;
			Adapter.UpdateCommand.Parameters[180].Value = Original_Tax.Value;
		}
		else
		{
			Adapter.UpdateCommand.Parameters[179].Value = 1;
			Adapter.UpdateCommand.Parameters[180].Value = DBNull.Value;
		}
		if (Original_SspValue1.HasValue)
		{
			Adapter.UpdateCommand.Parameters[181].Value = 0;
			Adapter.UpdateCommand.Parameters[182].Value = Original_SspValue1.Value;
		}
		else
		{
			Adapter.UpdateCommand.Parameters[181].Value = 1;
			Adapter.UpdateCommand.Parameters[182].Value = DBNull.Value;
		}
		if (Original_SspValue2.HasValue)
		{
			Adapter.UpdateCommand.Parameters[183].Value = 0;
			Adapter.UpdateCommand.Parameters[184].Value = Original_SspValue2.Value;
		}
		else
		{
			Adapter.UpdateCommand.Parameters[183].Value = 1;
			Adapter.UpdateCommand.Parameters[184].Value = DBNull.Value;
		}
		if (Original_SspValue3.HasValue)
		{
			Adapter.UpdateCommand.Parameters[185].Value = 0;
			Adapter.UpdateCommand.Parameters[186].Value = Original_SspValue3.Value;
		}
		else
		{
			Adapter.UpdateCommand.Parameters[185].Value = 1;
			Adapter.UpdateCommand.Parameters[186].Value = DBNull.Value;
		}
		if (Original_SspValue4.HasValue)
		{
			Adapter.UpdateCommand.Parameters[187].Value = 0;
			Adapter.UpdateCommand.Parameters[188].Value = Original_SspValue4.Value;
		}
		else
		{
			Adapter.UpdateCommand.Parameters[187].Value = 1;
			Adapter.UpdateCommand.Parameters[188].Value = DBNull.Value;
		}
		if (Original_SType.HasValue)
		{
			Adapter.UpdateCommand.Parameters[189].Value = 0;
			Adapter.UpdateCommand.Parameters[190].Value = Original_SType.Value;
		}
		else
		{
			Adapter.UpdateCommand.Parameters[189].Value = 1;
			Adapter.UpdateCommand.Parameters[190].Value = DBNull.Value;
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
	[HelpKeyword("vs.data.TableAdapter")]
	[DebuggerNonUserCode]
	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	public virtual int Update(bool Valid, int? Remark, string Index, int? UnitID, decimal? Price, decimal? Cost, decimal? Tare, int? BarF1, int? BarF2, int? BarT1, int? BarT2, int? LabelID1, int? LabelID2, int? ClassID, int? PS_SD, int? PS_ST, int? PS_PD, int? PS_PT, int? PS_UD, int? PC_SD, int? PC_ST, int? PC_PD, int? PC_PT, int? PC_UD, int? DF_U, int? DF_D, decimal? DF_UN, decimal? DF_DN, int? DA_Sort1, int? DA_Day1, decimal? DA_Up1, decimal? DA_Dn1, decimal? DA_Num1, int? DA_Sort2, int? DA_Day2, decimal? DA_Up2, decimal? DA_Dn2, decimal? DA_Num2, int? DA_Sort3, int? DA_Day3, decimal? DA_Up3, decimal? DA_Dn3, decimal? DA_Num3, int? DA_Sort4, int? DA_Day4, decimal? DA_Up4, decimal? DA_Dn4, decimal? DA_Num4, string Name, string Text1, string Text2, string Text3, string Text4, string Text5, string Text6, string Text7, int? TaxType, int? Tax, int? SspValue1, int? SspValue2, int? SspValue3, int? SspValue4, int? SType, int? Original_PLUID, bool Original_Valid, int? Original_Remark, string Original_Index, int? Original_UnitID, decimal? Original_Price, decimal? Original_Cost, decimal? Original_Tare, int? Original_BarF1, int? Original_BarF2, int? Original_BarT1, int? Original_BarT2, int? Original_LabelID1, int? Original_LabelID2, int? Original_ClassID, int? Original_PS_SD, int? Original_PS_ST, int? Original_PS_PD, int? Original_PS_PT, int? Original_PS_UD, int? Original_PC_SD, int? Original_PC_ST, int? Original_PC_PD, int? Original_PC_PT, int? Original_PC_UD, int? Original_DF_U, int? Original_DF_D, decimal? Original_DF_UN, decimal? Original_DF_DN, int? Original_DA_Sort1, int? Original_DA_Day1, decimal? Original_DA_Up1, decimal? Original_DA_Dn1, decimal? Original_DA_Num1, int? Original_DA_Sort2, int? Original_DA_Day2, decimal? Original_DA_Up2, decimal? Original_DA_Dn2, decimal? Original_DA_Num2, int? Original_DA_Sort3, int? Original_DA_Day3, decimal? Original_DA_Up3, decimal? Original_DA_Dn3, decimal? Original_DA_Num3, int? Original_DA_Sort4, int? Original_DA_Day4, decimal? Original_DA_Up4, decimal? Original_DA_Dn4, decimal? Original_DA_Num4, string Original_Name, string Original_Text1, string Original_Text2, string Original_Text3, string Original_Text4, string Original_Text5, string Original_Text6, string Original_Text7, int? Original_TaxType, int? Original_Tax, int? Original_SspValue1, int? Original_SspValue2, int? Original_SspValue3, int? Original_SspValue4, int? Original_SType)
	{
		return Update(Original_PLUID, Valid, Remark, Index, UnitID, Price, Cost, Tare, BarF1, BarF2, BarT1, BarT2, LabelID1, LabelID2, ClassID, PS_SD, PS_ST, PS_PD, PS_PT, PS_UD, PC_SD, PC_ST, PC_PD, PC_PT, PC_UD, DF_U, DF_D, DF_UN, DF_DN, DA_Sort1, DA_Day1, DA_Up1, DA_Dn1, DA_Num1, DA_Sort2, DA_Day2, DA_Up2, DA_Dn2, DA_Num2, DA_Sort3, DA_Day3, DA_Up3, DA_Dn3, DA_Num3, DA_Sort4, DA_Day4, DA_Up4, DA_Dn4, DA_Num4, Name, Text1, Text2, Text3, Text4, Text5, Text6, Text7, TaxType, Tax, SspValue1, SspValue2, SspValue3, SspValue4, SType, Original_PLUID, Original_Valid, Original_Remark, Original_Index, Original_UnitID, Original_Price, Original_Cost, Original_Tare, Original_BarF1, Original_BarF2, Original_BarT1, Original_BarT2, Original_LabelID1, Original_LabelID2, Original_ClassID, Original_PS_SD, Original_PS_ST, Original_PS_PD, Original_PS_PT, Original_PS_UD, Original_PC_SD, Original_PC_ST, Original_PC_PD, Original_PC_PT, Original_PC_UD, Original_DF_U, Original_DF_D, Original_DF_UN, Original_DF_DN, Original_DA_Sort1, Original_DA_Day1, Original_DA_Up1, Original_DA_Dn1, Original_DA_Num1, Original_DA_Sort2, Original_DA_Day2, Original_DA_Up2, Original_DA_Dn2, Original_DA_Num2, Original_DA_Sort3, Original_DA_Day3, Original_DA_Up3, Original_DA_Dn3, Original_DA_Num3, Original_DA_Sort4, Original_DA_Day4, Original_DA_Up4, Original_DA_Dn4, Original_DA_Num4, Original_Name, Original_Text1, Original_Text2, Original_Text3, Original_Text4, Original_Text5, Original_Text6, Original_Text7, Original_TaxType, Original_Tax, Original_SspValue1, Original_SspValue2, Original_SspValue3, Original_SspValue4, Original_SType);
	}
}
