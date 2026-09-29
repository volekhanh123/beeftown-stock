using System;
using System.CodeDom.Compiler;
using System.Collections;
using System.ComponentModel;
using System.ComponentModel.Design;
using System.Data;
using System.Diagnostics;
using System.Globalization;
using System.IO;
using System.Runtime.Serialization;
using System.Xml;
using System.Xml.Schema;
using System.Xml.Serialization;

namespace ECS;

[Serializable]
[XmlRoot("UIDataSet")]
[XmlSchemaProvider("GetTypedDataSetSchema")]
[ToolboxItem(true)]
[HelpKeyword("vs.data.DataSet")]
[DesignerCategory("code")]
public class UIDataSet : DataSet
{
	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	public delegate void PLU_PS_DateRowChangeEventHandler(object sender, PLU_PS_DateRowChangeEvent e);

	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	public delegate void PLU_PS_TimeRowChangeEventHandler(object sender, PLU_PS_TimeRowChangeEvent e);

	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	public delegate void LabelItem_PrintRowChangeEventHandler(object sender, LabelItem_PrintRowChangeEvent e);

	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	public delegate void LabelItem_AngleRowChangeEventHandler(object sender, LabelItem_AngleRowChangeEvent e);

	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	public delegate void LabelItem_Font1RowChangeEventHandler(object sender, LabelItem_Font1RowChangeEvent e);

	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	public delegate void LabelItem_AlignRowChangeEventHandler(object sender, LabelItem_AlignRowChangeEvent e);

	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	public delegate void Barcode_SourceRowChangeEventHandler(object sender, Barcode_SourceRowChangeEvent e);

	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	public delegate void Barcode_OverRowChangeEventHandler(object sender, Barcode_OverRowChangeEvent e);

	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	public delegate void Barcode_FormatRowChangeEventHandler(object sender, Barcode_FormatRowChangeEvent e);

	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	public delegate void Barcode_CheckRowChangeEventHandler(object sender, Barcode_CheckRowChangeEvent e);

	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	public delegate void Label_SortRowChangeEventHandler(object sender, Label_SortRowChangeEvent e);

	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	public delegate void String_InfoRowChangeEventHandler(object sender, String_InfoRowChangeEvent e);

	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	public delegate void Spec_InfoRowChangeEventHandler(object sender, Spec_InfoRowChangeEvent e);

	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	public delegate void PLU_DF_URowChangeEventHandler(object sender, PLU_DF_URowChangeEvent e);

	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	public delegate void PLU_DF_DRowChangeEventHandler(object sender, PLU_DF_DRowChangeEvent e);

	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	public delegate void PLU_DA_SortRowChangeEventHandler(object sender, PLU_DA_SortRowChangeEvent e);

	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	public delegate void LabelItem_Flag1RowChangeEventHandler(object sender, LabelItem_Flag1RowChangeEvent e);

	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	public delegate void LabelItem_Flag2RowChangeEventHandler(object sender, LabelItem_Flag2RowChangeEvent e);

	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	public delegate void LabelItem_Flag4RowChangeEventHandler(object sender, LabelItem_Flag4RowChangeEvent e);

	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	public delegate void LabelItem_Flag3RowChangeEventHandler(object sender, LabelItem_Flag3RowChangeEvent e);

	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	public delegate void PLU_ColRowChangeEventHandler(object sender, PLU_ColRowChangeEvent e);

	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	public delegate void ConfigRowChangeEventHandler(object sender, ConfigRowChangeEvent e);

	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	public delegate void Unit_TypeRowChangeEventHandler(object sender, Unit_TypeRowChangeEvent e);

	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	public delegate void LabelItem_Font2RowChangeEventHandler(object sender, LabelItem_Font2RowChangeEvent e);

	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	public delegate void Label_VersionRowChangeEventHandler(object sender, Label_VersionRowChangeEvent e);

	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	public delegate void PLU_TaxTypeRowChangeEventHandler(object sender, PLU_TaxTypeRowChangeEvent e);

	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	public delegate void Report_ColRowChangeEventHandler(object sender, Report_ColRowChangeEvent e);

	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	public delegate void Network_TaskRowChangeEventHandler(object sender, Network_TaskRowChangeEvent e);

	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	public delegate void Network_DueRowChangeEventHandler(object sender, Network_DueRowChangeEvent e);

	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	public delegate void Network_AutoRowChangeEventHandler(object sender, Network_AutoRowChangeEvent e);

	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	public delegate void CustomRowChangeEventHandler(object sender, CustomRowChangeEvent e);

	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	public delegate void CustomItemRowChangeEventHandler(object sender, CustomItemRowChangeEvent e);

	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	public delegate void ScPLU_LayoutRowChangeEventHandler(object sender, ScPLU_LayoutRowChangeEvent e);

	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	public delegate void ScPLU_PageRowChangeEventHandler(object sender, ScPLU_PageRowChangeEvent e);

	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	public delegate void ScPLU_SectionRowChangeEventHandler(object sender, ScPLU_SectionRowChangeEvent e);

	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	public delegate void ScPLU_PageInfoRowChangeEventHandler(object sender, ScPLU_PageInfoRowChangeEvent e);

	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	public delegate void TXTForm_TypeRowChangeEventHandler(object sender, TXTForm_TypeRowChangeEvent e);

	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	public delegate void SimComboRowChangeEventHandler(object sender, SimComboRowChangeEvent e);

	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	public delegate void LangRowChangeEventHandler(object sender, LangRowChangeEvent e);

	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	public delegate void PTCRowChangeEventHandler(object sender, PTCRowChangeEvent e);

	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	public delegate void FileTask_ContentRowChangeEventHandler(object sender, FileTask_ContentRowChangeEvent e);

	[Serializable]
	[XmlSchemaProvider("GetTypedTableSchema")]
	public class PLU_PS_DateDataTable : DataTable, IEnumerable
	{
		private DataColumn columnValue;

		private DataColumn columnDisplay;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public DataColumn ValueColumn => columnValue;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public DataColumn DisplayColumn => columnDisplay;

		[Browsable(false)]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public int Count => base.Rows.Count;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public PLU_PS_DateRow this[int index] => (PLU_PS_DateRow)base.Rows[index];

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public event PLU_PS_DateRowChangeEventHandler PLU_PS_DateRowChanging;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public event PLU_PS_DateRowChangeEventHandler PLU_PS_DateRowChanged;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public event PLU_PS_DateRowChangeEventHandler PLU_PS_DateRowDeleting;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public event PLU_PS_DateRowChangeEventHandler PLU_PS_DateRowDeleted;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public PLU_PS_DateDataTable()
		{
			base.TableName = "PLU_PS_Date";
			BeginInit();
			InitClass();
			EndInit();
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		internal PLU_PS_DateDataTable(DataTable table)
		{
			base.TableName = table.TableName;
			if (table.CaseSensitive != table.DataSet.CaseSensitive)
			{
				base.CaseSensitive = table.CaseSensitive;
			}
			if (table.Locale.ToString() != table.DataSet.Locale.ToString())
			{
				base.Locale = table.Locale;
			}
			if (table.Namespace != table.DataSet.Namespace)
			{
				base.Namespace = table.Namespace;
			}
			base.Prefix = table.Prefix;
			base.MinimumCapacity = table.MinimumCapacity;
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		protected PLU_PS_DateDataTable(SerializationInfo info, StreamingContext context)
			: base(info, context)
		{
			InitVars();
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public void AddPLU_PS_DateRow(PLU_PS_DateRow row)
		{
			base.Rows.Add(row);
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public PLU_PS_DateRow AddPLU_PS_DateRow(int Value, string Display)
		{
			PLU_PS_DateRow pLU_PS_DateRow = (PLU_PS_DateRow)NewRow();
			object[] itemArray = new object[2] { Value, Display };
			pLU_PS_DateRow.ItemArray = itemArray;
			base.Rows.Add(pLU_PS_DateRow);
			return pLU_PS_DateRow;
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public PLU_PS_DateRow FindByValue(int Value)
		{
			return (PLU_PS_DateRow)base.Rows.Find(new object[1] { Value });
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public virtual IEnumerator GetEnumerator()
		{
			return base.Rows.GetEnumerator();
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public override DataTable Clone()
		{
			PLU_PS_DateDataTable pLU_PS_DateDataTable = (PLU_PS_DateDataTable)base.Clone();
			pLU_PS_DateDataTable.InitVars();
			return pLU_PS_DateDataTable;
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		protected override DataTable CreateInstance()
		{
			return new PLU_PS_DateDataTable();
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		internal void InitVars()
		{
			columnValue = base.Columns["Value"];
			columnDisplay = base.Columns["Display"];
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		private void InitClass()
		{
			columnValue = new DataColumn("Value", typeof(int), null, MappingType.Element);
			base.Columns.Add(columnValue);
			columnDisplay = new DataColumn("Display", typeof(string), null, MappingType.Element);
			base.Columns.Add(columnDisplay);
			base.Constraints.Add(new UniqueConstraint("Constraint1", new DataColumn[1] { columnValue }, isPrimaryKey: true));
			columnValue.AllowDBNull = false;
			columnValue.Unique = true;
			columnDisplay.AllowDBNull = false;
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public PLU_PS_DateRow NewPLU_PS_DateRow()
		{
			return (PLU_PS_DateRow)NewRow();
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		protected override DataRow NewRowFromBuilder(DataRowBuilder builder)
		{
			return new PLU_PS_DateRow(builder);
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		protected override Type GetRowType()
		{
			return typeof(PLU_PS_DateRow);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		protected override void OnRowChanged(DataRowChangeEventArgs e)
		{
			base.OnRowChanged(e);
			if (this.PLU_PS_DateRowChanged != null)
			{
				this.PLU_PS_DateRowChanged(this, new PLU_PS_DateRowChangeEvent((PLU_PS_DateRow)e.Row, e.Action));
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		protected override void OnRowChanging(DataRowChangeEventArgs e)
		{
			base.OnRowChanging(e);
			if (this.PLU_PS_DateRowChanging != null)
			{
				this.PLU_PS_DateRowChanging(this, new PLU_PS_DateRowChangeEvent((PLU_PS_DateRow)e.Row, e.Action));
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		protected override void OnRowDeleted(DataRowChangeEventArgs e)
		{
			base.OnRowDeleted(e);
			if (this.PLU_PS_DateRowDeleted != null)
			{
				this.PLU_PS_DateRowDeleted(this, new PLU_PS_DateRowChangeEvent((PLU_PS_DateRow)e.Row, e.Action));
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		protected override void OnRowDeleting(DataRowChangeEventArgs e)
		{
			base.OnRowDeleting(e);
			if (this.PLU_PS_DateRowDeleting != null)
			{
				this.PLU_PS_DateRowDeleting(this, new PLU_PS_DateRowChangeEvent((PLU_PS_DateRow)e.Row, e.Action));
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public void RemovePLU_PS_DateRow(PLU_PS_DateRow row)
		{
			base.Rows.Remove(row);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public static XmlSchemaComplexType GetTypedTableSchema(XmlSchemaSet xs)
		{
			XmlSchemaComplexType xmlSchemaComplexType = new XmlSchemaComplexType();
			XmlSchemaSequence xmlSchemaSequence = new XmlSchemaSequence();
			UIDataSet uIDataSet = new UIDataSet();
			XmlSchemaAny xmlSchemaAny = new XmlSchemaAny();
			xmlSchemaAny.Namespace = "http://www.w3.org/2001/XMLSchema";
			xmlSchemaAny.MinOccurs = 0m;
			xmlSchemaAny.MaxOccurs = decimal.MaxValue;
			xmlSchemaAny.ProcessContents = XmlSchemaContentProcessing.Lax;
			xmlSchemaSequence.Items.Add(xmlSchemaAny);
			XmlSchemaAny xmlSchemaAny2 = new XmlSchemaAny();
			xmlSchemaAny2.Namespace = "urn:schemas-microsoft-com:xml-diffgram-v1";
			xmlSchemaAny2.MinOccurs = 1m;
			xmlSchemaAny2.ProcessContents = XmlSchemaContentProcessing.Lax;
			xmlSchemaSequence.Items.Add(xmlSchemaAny2);
			XmlSchemaAttribute xmlSchemaAttribute = new XmlSchemaAttribute();
			xmlSchemaAttribute.Name = "namespace";
			xmlSchemaAttribute.FixedValue = uIDataSet.Namespace;
			xmlSchemaComplexType.Attributes.Add(xmlSchemaAttribute);
			XmlSchemaAttribute xmlSchemaAttribute2 = new XmlSchemaAttribute();
			xmlSchemaAttribute2.Name = "tableTypeName";
			xmlSchemaAttribute2.FixedValue = "PLU_PS_DateDataTable";
			xmlSchemaComplexType.Attributes.Add(xmlSchemaAttribute2);
			xmlSchemaComplexType.Particle = xmlSchemaSequence;
			XmlSchema schemaSerializable = uIDataSet.GetSchemaSerializable();
			if (xs.Contains(schemaSerializable.TargetNamespace))
			{
				MemoryStream memoryStream = new MemoryStream();
				MemoryStream memoryStream2 = new MemoryStream();
				try
				{
					XmlSchema xmlSchema = null;
					schemaSerializable.Write(memoryStream);
					IEnumerator enumerator = xs.Schemas(schemaSerializable.TargetNamespace).GetEnumerator();
					while (enumerator.MoveNext())
					{
						xmlSchema = (XmlSchema)enumerator.Current;
						memoryStream2.SetLength(0L);
						xmlSchema.Write(memoryStream2);
						if (memoryStream.Length == memoryStream2.Length)
						{
							memoryStream.Position = 0L;
							memoryStream2.Position = 0L;
							while (memoryStream.Position != memoryStream.Length && memoryStream.ReadByte() == memoryStream2.ReadByte())
							{
							}
							if (memoryStream.Position == memoryStream.Length)
							{
								return xmlSchemaComplexType;
							}
						}
					}
				}
				finally
				{
					memoryStream?.Close();
					memoryStream2?.Close();
				}
			}
			xs.Add(schemaSerializable);
			return xmlSchemaComplexType;
		}
	}

	[Serializable]
	[XmlSchemaProvider("GetTypedTableSchema")]
	public class PLU_PS_TimeDataTable : DataTable, IEnumerable
	{
		private DataColumn columnValue;

		private DataColumn columnDisplay;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public DataColumn ValueColumn => columnValue;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public DataColumn DisplayColumn => columnDisplay;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[Browsable(false)]
		public int Count => base.Rows.Count;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public PLU_PS_TimeRow this[int index] => (PLU_PS_TimeRow)base.Rows[index];

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public event PLU_PS_TimeRowChangeEventHandler PLU_PS_TimeRowChanging;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public event PLU_PS_TimeRowChangeEventHandler PLU_PS_TimeRowChanged;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public event PLU_PS_TimeRowChangeEventHandler PLU_PS_TimeRowDeleting;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public event PLU_PS_TimeRowChangeEventHandler PLU_PS_TimeRowDeleted;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public PLU_PS_TimeDataTable()
		{
			base.TableName = "PLU_PS_Time";
			BeginInit();
			InitClass();
			EndInit();
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		internal PLU_PS_TimeDataTable(DataTable table)
		{
			base.TableName = table.TableName;
			if (table.CaseSensitive != table.DataSet.CaseSensitive)
			{
				base.CaseSensitive = table.CaseSensitive;
			}
			if (table.Locale.ToString() != table.DataSet.Locale.ToString())
			{
				base.Locale = table.Locale;
			}
			if (table.Namespace != table.DataSet.Namespace)
			{
				base.Namespace = table.Namespace;
			}
			base.Prefix = table.Prefix;
			base.MinimumCapacity = table.MinimumCapacity;
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		protected PLU_PS_TimeDataTable(SerializationInfo info, StreamingContext context)
			: base(info, context)
		{
			InitVars();
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public void AddPLU_PS_TimeRow(PLU_PS_TimeRow row)
		{
			base.Rows.Add(row);
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public PLU_PS_TimeRow AddPLU_PS_TimeRow(int Value, string Display)
		{
			PLU_PS_TimeRow pLU_PS_TimeRow = (PLU_PS_TimeRow)NewRow();
			object[] itemArray = new object[2] { Value, Display };
			pLU_PS_TimeRow.ItemArray = itemArray;
			base.Rows.Add(pLU_PS_TimeRow);
			return pLU_PS_TimeRow;
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public PLU_PS_TimeRow FindByValue(int Value)
		{
			return (PLU_PS_TimeRow)base.Rows.Find(new object[1] { Value });
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public virtual IEnumerator GetEnumerator()
		{
			return base.Rows.GetEnumerator();
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public override DataTable Clone()
		{
			PLU_PS_TimeDataTable pLU_PS_TimeDataTable = (PLU_PS_TimeDataTable)base.Clone();
			pLU_PS_TimeDataTable.InitVars();
			return pLU_PS_TimeDataTable;
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		protected override DataTable CreateInstance()
		{
			return new PLU_PS_TimeDataTable();
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		internal void InitVars()
		{
			columnValue = base.Columns["Value"];
			columnDisplay = base.Columns["Display"];
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		private void InitClass()
		{
			columnValue = new DataColumn("Value", typeof(int), null, MappingType.Element);
			base.Columns.Add(columnValue);
			columnDisplay = new DataColumn("Display", typeof(string), null, MappingType.Element);
			base.Columns.Add(columnDisplay);
			base.Constraints.Add(new UniqueConstraint("Constraint1", new DataColumn[1] { columnValue }, isPrimaryKey: true));
			columnValue.AllowDBNull = false;
			columnValue.Unique = true;
			columnDisplay.AllowDBNull = false;
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public PLU_PS_TimeRow NewPLU_PS_TimeRow()
		{
			return (PLU_PS_TimeRow)NewRow();
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		protected override DataRow NewRowFromBuilder(DataRowBuilder builder)
		{
			return new PLU_PS_TimeRow(builder);
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		protected override Type GetRowType()
		{
			return typeof(PLU_PS_TimeRow);
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		protected override void OnRowChanged(DataRowChangeEventArgs e)
		{
			base.OnRowChanged(e);
			if (this.PLU_PS_TimeRowChanged != null)
			{
				this.PLU_PS_TimeRowChanged(this, new PLU_PS_TimeRowChangeEvent((PLU_PS_TimeRow)e.Row, e.Action));
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		protected override void OnRowChanging(DataRowChangeEventArgs e)
		{
			base.OnRowChanging(e);
			if (this.PLU_PS_TimeRowChanging != null)
			{
				this.PLU_PS_TimeRowChanging(this, new PLU_PS_TimeRowChangeEvent((PLU_PS_TimeRow)e.Row, e.Action));
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		protected override void OnRowDeleted(DataRowChangeEventArgs e)
		{
			base.OnRowDeleted(e);
			if (this.PLU_PS_TimeRowDeleted != null)
			{
				this.PLU_PS_TimeRowDeleted(this, new PLU_PS_TimeRowChangeEvent((PLU_PS_TimeRow)e.Row, e.Action));
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		protected override void OnRowDeleting(DataRowChangeEventArgs e)
		{
			base.OnRowDeleting(e);
			if (this.PLU_PS_TimeRowDeleting != null)
			{
				this.PLU_PS_TimeRowDeleting(this, new PLU_PS_TimeRowChangeEvent((PLU_PS_TimeRow)e.Row, e.Action));
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public void RemovePLU_PS_TimeRow(PLU_PS_TimeRow row)
		{
			base.Rows.Remove(row);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public static XmlSchemaComplexType GetTypedTableSchema(XmlSchemaSet xs)
		{
			XmlSchemaComplexType xmlSchemaComplexType = new XmlSchemaComplexType();
			XmlSchemaSequence xmlSchemaSequence = new XmlSchemaSequence();
			UIDataSet uIDataSet = new UIDataSet();
			XmlSchemaAny xmlSchemaAny = new XmlSchemaAny();
			xmlSchemaAny.Namespace = "http://www.w3.org/2001/XMLSchema";
			xmlSchemaAny.MinOccurs = 0m;
			xmlSchemaAny.MaxOccurs = decimal.MaxValue;
			xmlSchemaAny.ProcessContents = XmlSchemaContentProcessing.Lax;
			xmlSchemaSequence.Items.Add(xmlSchemaAny);
			XmlSchemaAny xmlSchemaAny2 = new XmlSchemaAny();
			xmlSchemaAny2.Namespace = "urn:schemas-microsoft-com:xml-diffgram-v1";
			xmlSchemaAny2.MinOccurs = 1m;
			xmlSchemaAny2.ProcessContents = XmlSchemaContentProcessing.Lax;
			xmlSchemaSequence.Items.Add(xmlSchemaAny2);
			XmlSchemaAttribute xmlSchemaAttribute = new XmlSchemaAttribute();
			xmlSchemaAttribute.Name = "namespace";
			xmlSchemaAttribute.FixedValue = uIDataSet.Namespace;
			xmlSchemaComplexType.Attributes.Add(xmlSchemaAttribute);
			XmlSchemaAttribute xmlSchemaAttribute2 = new XmlSchemaAttribute();
			xmlSchemaAttribute2.Name = "tableTypeName";
			xmlSchemaAttribute2.FixedValue = "PLU_PS_TimeDataTable";
			xmlSchemaComplexType.Attributes.Add(xmlSchemaAttribute2);
			xmlSchemaComplexType.Particle = xmlSchemaSequence;
			XmlSchema schemaSerializable = uIDataSet.GetSchemaSerializable();
			if (xs.Contains(schemaSerializable.TargetNamespace))
			{
				MemoryStream memoryStream = new MemoryStream();
				MemoryStream memoryStream2 = new MemoryStream();
				try
				{
					XmlSchema xmlSchema = null;
					schemaSerializable.Write(memoryStream);
					IEnumerator enumerator = xs.Schemas(schemaSerializable.TargetNamespace).GetEnumerator();
					while (enumerator.MoveNext())
					{
						xmlSchema = (XmlSchema)enumerator.Current;
						memoryStream2.SetLength(0L);
						xmlSchema.Write(memoryStream2);
						if (memoryStream.Length == memoryStream2.Length)
						{
							memoryStream.Position = 0L;
							memoryStream2.Position = 0L;
							while (memoryStream.Position != memoryStream.Length && memoryStream.ReadByte() == memoryStream2.ReadByte())
							{
							}
							if (memoryStream.Position == memoryStream.Length)
							{
								return xmlSchemaComplexType;
							}
						}
					}
				}
				finally
				{
					memoryStream?.Close();
					memoryStream2?.Close();
				}
			}
			xs.Add(schemaSerializable);
			return xmlSchemaComplexType;
		}
	}

	[Serializable]
	[XmlSchemaProvider("GetTypedTableSchema")]
	public class LabelItem_PrintDataTable : DataTable, IEnumerable
	{
		private DataColumn columnValue;

		private DataColumn columnDisplay;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public DataColumn ValueColumn => columnValue;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public DataColumn DisplayColumn => columnDisplay;

		[Browsable(false)]
		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public int Count => base.Rows.Count;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public LabelItem_PrintRow this[int index] => (LabelItem_PrintRow)base.Rows[index];

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public event LabelItem_PrintRowChangeEventHandler LabelItem_PrintRowChanging;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public event LabelItem_PrintRowChangeEventHandler LabelItem_PrintRowChanged;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public event LabelItem_PrintRowChangeEventHandler LabelItem_PrintRowDeleting;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public event LabelItem_PrintRowChangeEventHandler LabelItem_PrintRowDeleted;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public LabelItem_PrintDataTable()
		{
			base.TableName = "LabelItem_Print";
			BeginInit();
			InitClass();
			EndInit();
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		internal LabelItem_PrintDataTable(DataTable table)
		{
			base.TableName = table.TableName;
			if (table.CaseSensitive != table.DataSet.CaseSensitive)
			{
				base.CaseSensitive = table.CaseSensitive;
			}
			if (table.Locale.ToString() != table.DataSet.Locale.ToString())
			{
				base.Locale = table.Locale;
			}
			if (table.Namespace != table.DataSet.Namespace)
			{
				base.Namespace = table.Namespace;
			}
			base.Prefix = table.Prefix;
			base.MinimumCapacity = table.MinimumCapacity;
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		protected LabelItem_PrintDataTable(SerializationInfo info, StreamingContext context)
			: base(info, context)
		{
			InitVars();
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public void AddLabelItem_PrintRow(LabelItem_PrintRow row)
		{
			base.Rows.Add(row);
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public LabelItem_PrintRow AddLabelItem_PrintRow(int Value, string Display)
		{
			LabelItem_PrintRow labelItem_PrintRow = (LabelItem_PrintRow)NewRow();
			object[] itemArray = new object[2] { Value, Display };
			labelItem_PrintRow.ItemArray = itemArray;
			base.Rows.Add(labelItem_PrintRow);
			return labelItem_PrintRow;
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public LabelItem_PrintRow FindByValue(int Value)
		{
			return (LabelItem_PrintRow)base.Rows.Find(new object[1] { Value });
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public virtual IEnumerator GetEnumerator()
		{
			return base.Rows.GetEnumerator();
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public override DataTable Clone()
		{
			LabelItem_PrintDataTable labelItem_PrintDataTable = (LabelItem_PrintDataTable)base.Clone();
			labelItem_PrintDataTable.InitVars();
			return labelItem_PrintDataTable;
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		protected override DataTable CreateInstance()
		{
			return new LabelItem_PrintDataTable();
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		internal void InitVars()
		{
			columnValue = base.Columns["Value"];
			columnDisplay = base.Columns["Display"];
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		private void InitClass()
		{
			columnValue = new DataColumn("Value", typeof(int), null, MappingType.Element);
			base.Columns.Add(columnValue);
			columnDisplay = new DataColumn("Display", typeof(string), null, MappingType.Element);
			base.Columns.Add(columnDisplay);
			base.Constraints.Add(new UniqueConstraint("Constraint1", new DataColumn[1] { columnValue }, isPrimaryKey: true));
			columnValue.AllowDBNull = false;
			columnValue.Unique = true;
			columnDisplay.AllowDBNull = false;
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public LabelItem_PrintRow NewLabelItem_PrintRow()
		{
			return (LabelItem_PrintRow)NewRow();
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		protected override DataRow NewRowFromBuilder(DataRowBuilder builder)
		{
			return new LabelItem_PrintRow(builder);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		protected override Type GetRowType()
		{
			return typeof(LabelItem_PrintRow);
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		protected override void OnRowChanged(DataRowChangeEventArgs e)
		{
			base.OnRowChanged(e);
			if (this.LabelItem_PrintRowChanged != null)
			{
				this.LabelItem_PrintRowChanged(this, new LabelItem_PrintRowChangeEvent((LabelItem_PrintRow)e.Row, e.Action));
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		protected override void OnRowChanging(DataRowChangeEventArgs e)
		{
			base.OnRowChanging(e);
			if (this.LabelItem_PrintRowChanging != null)
			{
				this.LabelItem_PrintRowChanging(this, new LabelItem_PrintRowChangeEvent((LabelItem_PrintRow)e.Row, e.Action));
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		protected override void OnRowDeleted(DataRowChangeEventArgs e)
		{
			base.OnRowDeleted(e);
			if (this.LabelItem_PrintRowDeleted != null)
			{
				this.LabelItem_PrintRowDeleted(this, new LabelItem_PrintRowChangeEvent((LabelItem_PrintRow)e.Row, e.Action));
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		protected override void OnRowDeleting(DataRowChangeEventArgs e)
		{
			base.OnRowDeleting(e);
			if (this.LabelItem_PrintRowDeleting != null)
			{
				this.LabelItem_PrintRowDeleting(this, new LabelItem_PrintRowChangeEvent((LabelItem_PrintRow)e.Row, e.Action));
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public void RemoveLabelItem_PrintRow(LabelItem_PrintRow row)
		{
			base.Rows.Remove(row);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public static XmlSchemaComplexType GetTypedTableSchema(XmlSchemaSet xs)
		{
			XmlSchemaComplexType xmlSchemaComplexType = new XmlSchemaComplexType();
			XmlSchemaSequence xmlSchemaSequence = new XmlSchemaSequence();
			UIDataSet uIDataSet = new UIDataSet();
			XmlSchemaAny xmlSchemaAny = new XmlSchemaAny();
			xmlSchemaAny.Namespace = "http://www.w3.org/2001/XMLSchema";
			xmlSchemaAny.MinOccurs = 0m;
			xmlSchemaAny.MaxOccurs = decimal.MaxValue;
			xmlSchemaAny.ProcessContents = XmlSchemaContentProcessing.Lax;
			xmlSchemaSequence.Items.Add(xmlSchemaAny);
			XmlSchemaAny xmlSchemaAny2 = new XmlSchemaAny();
			xmlSchemaAny2.Namespace = "urn:schemas-microsoft-com:xml-diffgram-v1";
			xmlSchemaAny2.MinOccurs = 1m;
			xmlSchemaAny2.ProcessContents = XmlSchemaContentProcessing.Lax;
			xmlSchemaSequence.Items.Add(xmlSchemaAny2);
			XmlSchemaAttribute xmlSchemaAttribute = new XmlSchemaAttribute();
			xmlSchemaAttribute.Name = "namespace";
			xmlSchemaAttribute.FixedValue = uIDataSet.Namespace;
			xmlSchemaComplexType.Attributes.Add(xmlSchemaAttribute);
			XmlSchemaAttribute xmlSchemaAttribute2 = new XmlSchemaAttribute();
			xmlSchemaAttribute2.Name = "tableTypeName";
			xmlSchemaAttribute2.FixedValue = "LabelItem_PrintDataTable";
			xmlSchemaComplexType.Attributes.Add(xmlSchemaAttribute2);
			xmlSchemaComplexType.Particle = xmlSchemaSequence;
			XmlSchema schemaSerializable = uIDataSet.GetSchemaSerializable();
			if (xs.Contains(schemaSerializable.TargetNamespace))
			{
				MemoryStream memoryStream = new MemoryStream();
				MemoryStream memoryStream2 = new MemoryStream();
				try
				{
					XmlSchema xmlSchema = null;
					schemaSerializable.Write(memoryStream);
					IEnumerator enumerator = xs.Schemas(schemaSerializable.TargetNamespace).GetEnumerator();
					while (enumerator.MoveNext())
					{
						xmlSchema = (XmlSchema)enumerator.Current;
						memoryStream2.SetLength(0L);
						xmlSchema.Write(memoryStream2);
						if (memoryStream.Length == memoryStream2.Length)
						{
							memoryStream.Position = 0L;
							memoryStream2.Position = 0L;
							while (memoryStream.Position != memoryStream.Length && memoryStream.ReadByte() == memoryStream2.ReadByte())
							{
							}
							if (memoryStream.Position == memoryStream.Length)
							{
								return xmlSchemaComplexType;
							}
						}
					}
				}
				finally
				{
					memoryStream?.Close();
					memoryStream2?.Close();
				}
			}
			xs.Add(schemaSerializable);
			return xmlSchemaComplexType;
		}
	}

	[Serializable]
	[XmlSchemaProvider("GetTypedTableSchema")]
	public class LabelItem_AngleDataTable : DataTable, IEnumerable
	{
		private DataColumn columnValue;

		private DataColumn columnDisplay;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public DataColumn ValueColumn => columnValue;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public DataColumn DisplayColumn => columnDisplay;

		[DebuggerNonUserCode]
		[Browsable(false)]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public int Count => base.Rows.Count;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public LabelItem_AngleRow this[int index] => (LabelItem_AngleRow)base.Rows[index];

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public event LabelItem_AngleRowChangeEventHandler LabelItem_AngleRowChanging;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public event LabelItem_AngleRowChangeEventHandler LabelItem_AngleRowChanged;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public event LabelItem_AngleRowChangeEventHandler LabelItem_AngleRowDeleting;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public event LabelItem_AngleRowChangeEventHandler LabelItem_AngleRowDeleted;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public LabelItem_AngleDataTable()
		{
			base.TableName = "LabelItem_Angle";
			BeginInit();
			InitClass();
			EndInit();
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		internal LabelItem_AngleDataTable(DataTable table)
		{
			base.TableName = table.TableName;
			if (table.CaseSensitive != table.DataSet.CaseSensitive)
			{
				base.CaseSensitive = table.CaseSensitive;
			}
			if (table.Locale.ToString() != table.DataSet.Locale.ToString())
			{
				base.Locale = table.Locale;
			}
			if (table.Namespace != table.DataSet.Namespace)
			{
				base.Namespace = table.Namespace;
			}
			base.Prefix = table.Prefix;
			base.MinimumCapacity = table.MinimumCapacity;
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		protected LabelItem_AngleDataTable(SerializationInfo info, StreamingContext context)
			: base(info, context)
		{
			InitVars();
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public void AddLabelItem_AngleRow(LabelItem_AngleRow row)
		{
			base.Rows.Add(row);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public LabelItem_AngleRow AddLabelItem_AngleRow(int Value, string Display)
		{
			LabelItem_AngleRow labelItem_AngleRow = (LabelItem_AngleRow)NewRow();
			object[] itemArray = new object[2] { Value, Display };
			labelItem_AngleRow.ItemArray = itemArray;
			base.Rows.Add(labelItem_AngleRow);
			return labelItem_AngleRow;
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public LabelItem_AngleRow FindByValue(int Value)
		{
			return (LabelItem_AngleRow)base.Rows.Find(new object[1] { Value });
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public virtual IEnumerator GetEnumerator()
		{
			return base.Rows.GetEnumerator();
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public override DataTable Clone()
		{
			LabelItem_AngleDataTable labelItem_AngleDataTable = (LabelItem_AngleDataTable)base.Clone();
			labelItem_AngleDataTable.InitVars();
			return labelItem_AngleDataTable;
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		protected override DataTable CreateInstance()
		{
			return new LabelItem_AngleDataTable();
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		internal void InitVars()
		{
			columnValue = base.Columns["Value"];
			columnDisplay = base.Columns["Display"];
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		private void InitClass()
		{
			columnValue = new DataColumn("Value", typeof(int), null, MappingType.Element);
			base.Columns.Add(columnValue);
			columnDisplay = new DataColumn("Display", typeof(string), null, MappingType.Element);
			base.Columns.Add(columnDisplay);
			base.Constraints.Add(new UniqueConstraint("Constraint1", new DataColumn[1] { columnValue }, isPrimaryKey: true));
			columnValue.AllowDBNull = false;
			columnValue.Unique = true;
			columnDisplay.AllowDBNull = false;
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public LabelItem_AngleRow NewLabelItem_AngleRow()
		{
			return (LabelItem_AngleRow)NewRow();
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		protected override DataRow NewRowFromBuilder(DataRowBuilder builder)
		{
			return new LabelItem_AngleRow(builder);
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		protected override Type GetRowType()
		{
			return typeof(LabelItem_AngleRow);
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		protected override void OnRowChanged(DataRowChangeEventArgs e)
		{
			base.OnRowChanged(e);
			if (this.LabelItem_AngleRowChanged != null)
			{
				this.LabelItem_AngleRowChanged(this, new LabelItem_AngleRowChangeEvent((LabelItem_AngleRow)e.Row, e.Action));
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		protected override void OnRowChanging(DataRowChangeEventArgs e)
		{
			base.OnRowChanging(e);
			if (this.LabelItem_AngleRowChanging != null)
			{
				this.LabelItem_AngleRowChanging(this, new LabelItem_AngleRowChangeEvent((LabelItem_AngleRow)e.Row, e.Action));
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		protected override void OnRowDeleted(DataRowChangeEventArgs e)
		{
			base.OnRowDeleted(e);
			if (this.LabelItem_AngleRowDeleted != null)
			{
				this.LabelItem_AngleRowDeleted(this, new LabelItem_AngleRowChangeEvent((LabelItem_AngleRow)e.Row, e.Action));
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		protected override void OnRowDeleting(DataRowChangeEventArgs e)
		{
			base.OnRowDeleting(e);
			if (this.LabelItem_AngleRowDeleting != null)
			{
				this.LabelItem_AngleRowDeleting(this, new LabelItem_AngleRowChangeEvent((LabelItem_AngleRow)e.Row, e.Action));
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public void RemoveLabelItem_AngleRow(LabelItem_AngleRow row)
		{
			base.Rows.Remove(row);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public static XmlSchemaComplexType GetTypedTableSchema(XmlSchemaSet xs)
		{
			XmlSchemaComplexType xmlSchemaComplexType = new XmlSchemaComplexType();
			XmlSchemaSequence xmlSchemaSequence = new XmlSchemaSequence();
			UIDataSet uIDataSet = new UIDataSet();
			XmlSchemaAny xmlSchemaAny = new XmlSchemaAny();
			xmlSchemaAny.Namespace = "http://www.w3.org/2001/XMLSchema";
			xmlSchemaAny.MinOccurs = 0m;
			xmlSchemaAny.MaxOccurs = decimal.MaxValue;
			xmlSchemaAny.ProcessContents = XmlSchemaContentProcessing.Lax;
			xmlSchemaSequence.Items.Add(xmlSchemaAny);
			XmlSchemaAny xmlSchemaAny2 = new XmlSchemaAny();
			xmlSchemaAny2.Namespace = "urn:schemas-microsoft-com:xml-diffgram-v1";
			xmlSchemaAny2.MinOccurs = 1m;
			xmlSchemaAny2.ProcessContents = XmlSchemaContentProcessing.Lax;
			xmlSchemaSequence.Items.Add(xmlSchemaAny2);
			XmlSchemaAttribute xmlSchemaAttribute = new XmlSchemaAttribute();
			xmlSchemaAttribute.Name = "namespace";
			xmlSchemaAttribute.FixedValue = uIDataSet.Namespace;
			xmlSchemaComplexType.Attributes.Add(xmlSchemaAttribute);
			XmlSchemaAttribute xmlSchemaAttribute2 = new XmlSchemaAttribute();
			xmlSchemaAttribute2.Name = "tableTypeName";
			xmlSchemaAttribute2.FixedValue = "LabelItem_AngleDataTable";
			xmlSchemaComplexType.Attributes.Add(xmlSchemaAttribute2);
			xmlSchemaComplexType.Particle = xmlSchemaSequence;
			XmlSchema schemaSerializable = uIDataSet.GetSchemaSerializable();
			if (xs.Contains(schemaSerializable.TargetNamespace))
			{
				MemoryStream memoryStream = new MemoryStream();
				MemoryStream memoryStream2 = new MemoryStream();
				try
				{
					XmlSchema xmlSchema = null;
					schemaSerializable.Write(memoryStream);
					IEnumerator enumerator = xs.Schemas(schemaSerializable.TargetNamespace).GetEnumerator();
					while (enumerator.MoveNext())
					{
						xmlSchema = (XmlSchema)enumerator.Current;
						memoryStream2.SetLength(0L);
						xmlSchema.Write(memoryStream2);
						if (memoryStream.Length == memoryStream2.Length)
						{
							memoryStream.Position = 0L;
							memoryStream2.Position = 0L;
							while (memoryStream.Position != memoryStream.Length && memoryStream.ReadByte() == memoryStream2.ReadByte())
							{
							}
							if (memoryStream.Position == memoryStream.Length)
							{
								return xmlSchemaComplexType;
							}
						}
					}
				}
				finally
				{
					memoryStream?.Close();
					memoryStream2?.Close();
				}
			}
			xs.Add(schemaSerializable);
			return xmlSchemaComplexType;
		}
	}

	[Serializable]
	[XmlSchemaProvider("GetTypedTableSchema")]
	public class LabelItem_Font1DataTable : DataTable, IEnumerable
	{
		private DataColumn columnValue;

		private DataColumn columnDisplay;

		private DataColumn columnSize;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public DataColumn ValueColumn => columnValue;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public DataColumn DisplayColumn => columnDisplay;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public DataColumn SizeColumn => columnSize;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[Browsable(false)]
		public int Count => base.Rows.Count;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public LabelItem_Font1Row this[int index] => (LabelItem_Font1Row)base.Rows[index];

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public event LabelItem_Font1RowChangeEventHandler LabelItem_Font1RowChanging;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public event LabelItem_Font1RowChangeEventHandler LabelItem_Font1RowChanged;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public event LabelItem_Font1RowChangeEventHandler LabelItem_Font1RowDeleting;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public event LabelItem_Font1RowChangeEventHandler LabelItem_Font1RowDeleted;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public LabelItem_Font1DataTable()
		{
			base.TableName = "LabelItem_Font1";
			BeginInit();
			InitClass();
			EndInit();
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		internal LabelItem_Font1DataTable(DataTable table)
		{
			base.TableName = table.TableName;
			if (table.CaseSensitive != table.DataSet.CaseSensitive)
			{
				base.CaseSensitive = table.CaseSensitive;
			}
			if (table.Locale.ToString() != table.DataSet.Locale.ToString())
			{
				base.Locale = table.Locale;
			}
			if (table.Namespace != table.DataSet.Namespace)
			{
				base.Namespace = table.Namespace;
			}
			base.Prefix = table.Prefix;
			base.MinimumCapacity = table.MinimumCapacity;
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		protected LabelItem_Font1DataTable(SerializationInfo info, StreamingContext context)
			: base(info, context)
		{
			InitVars();
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public void AddLabelItem_Font1Row(LabelItem_Font1Row row)
		{
			base.Rows.Add(row);
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public LabelItem_Font1Row AddLabelItem_Font1Row(int Value, string Display, int Size)
		{
			LabelItem_Font1Row labelItem_Font1Row = (LabelItem_Font1Row)NewRow();
			object[] itemArray = new object[3] { Value, Display, Size };
			labelItem_Font1Row.ItemArray = itemArray;
			base.Rows.Add(labelItem_Font1Row);
			return labelItem_Font1Row;
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public LabelItem_Font1Row FindByValue(int Value)
		{
			return (LabelItem_Font1Row)base.Rows.Find(new object[1] { Value });
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public virtual IEnumerator GetEnumerator()
		{
			return base.Rows.GetEnumerator();
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public override DataTable Clone()
		{
			LabelItem_Font1DataTable labelItem_Font1DataTable = (LabelItem_Font1DataTable)base.Clone();
			labelItem_Font1DataTable.InitVars();
			return labelItem_Font1DataTable;
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		protected override DataTable CreateInstance()
		{
			return new LabelItem_Font1DataTable();
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		internal void InitVars()
		{
			columnValue = base.Columns["Value"];
			columnDisplay = base.Columns["Display"];
			columnSize = base.Columns["Size"];
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		private void InitClass()
		{
			columnValue = new DataColumn("Value", typeof(int), null, MappingType.Element);
			base.Columns.Add(columnValue);
			columnDisplay = new DataColumn("Display", typeof(string), null, MappingType.Element);
			base.Columns.Add(columnDisplay);
			columnSize = new DataColumn("Size", typeof(int), null, MappingType.Element);
			base.Columns.Add(columnSize);
			base.Constraints.Add(new UniqueConstraint("Constraint1", new DataColumn[1] { columnValue }, isPrimaryKey: true));
			columnValue.AllowDBNull = false;
			columnValue.Unique = true;
			columnDisplay.AllowDBNull = false;
			columnSize.AllowDBNull = false;
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public LabelItem_Font1Row NewLabelItem_Font1Row()
		{
			return (LabelItem_Font1Row)NewRow();
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		protected override DataRow NewRowFromBuilder(DataRowBuilder builder)
		{
			return new LabelItem_Font1Row(builder);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		protected override Type GetRowType()
		{
			return typeof(LabelItem_Font1Row);
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		protected override void OnRowChanged(DataRowChangeEventArgs e)
		{
			base.OnRowChanged(e);
			if (this.LabelItem_Font1RowChanged != null)
			{
				this.LabelItem_Font1RowChanged(this, new LabelItem_Font1RowChangeEvent((LabelItem_Font1Row)e.Row, e.Action));
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		protected override void OnRowChanging(DataRowChangeEventArgs e)
		{
			base.OnRowChanging(e);
			if (this.LabelItem_Font1RowChanging != null)
			{
				this.LabelItem_Font1RowChanging(this, new LabelItem_Font1RowChangeEvent((LabelItem_Font1Row)e.Row, e.Action));
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		protected override void OnRowDeleted(DataRowChangeEventArgs e)
		{
			base.OnRowDeleted(e);
			if (this.LabelItem_Font1RowDeleted != null)
			{
				this.LabelItem_Font1RowDeleted(this, new LabelItem_Font1RowChangeEvent((LabelItem_Font1Row)e.Row, e.Action));
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		protected override void OnRowDeleting(DataRowChangeEventArgs e)
		{
			base.OnRowDeleting(e);
			if (this.LabelItem_Font1RowDeleting != null)
			{
				this.LabelItem_Font1RowDeleting(this, new LabelItem_Font1RowChangeEvent((LabelItem_Font1Row)e.Row, e.Action));
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public void RemoveLabelItem_Font1Row(LabelItem_Font1Row row)
		{
			base.Rows.Remove(row);
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public static XmlSchemaComplexType GetTypedTableSchema(XmlSchemaSet xs)
		{
			XmlSchemaComplexType xmlSchemaComplexType = new XmlSchemaComplexType();
			XmlSchemaSequence xmlSchemaSequence = new XmlSchemaSequence();
			UIDataSet uIDataSet = new UIDataSet();
			XmlSchemaAny xmlSchemaAny = new XmlSchemaAny();
			xmlSchemaAny.Namespace = "http://www.w3.org/2001/XMLSchema";
			xmlSchemaAny.MinOccurs = 0m;
			xmlSchemaAny.MaxOccurs = decimal.MaxValue;
			xmlSchemaAny.ProcessContents = XmlSchemaContentProcessing.Lax;
			xmlSchemaSequence.Items.Add(xmlSchemaAny);
			XmlSchemaAny xmlSchemaAny2 = new XmlSchemaAny();
			xmlSchemaAny2.Namespace = "urn:schemas-microsoft-com:xml-diffgram-v1";
			xmlSchemaAny2.MinOccurs = 1m;
			xmlSchemaAny2.ProcessContents = XmlSchemaContentProcessing.Lax;
			xmlSchemaSequence.Items.Add(xmlSchemaAny2);
			XmlSchemaAttribute xmlSchemaAttribute = new XmlSchemaAttribute();
			xmlSchemaAttribute.Name = "namespace";
			xmlSchemaAttribute.FixedValue = uIDataSet.Namespace;
			xmlSchemaComplexType.Attributes.Add(xmlSchemaAttribute);
			XmlSchemaAttribute xmlSchemaAttribute2 = new XmlSchemaAttribute();
			xmlSchemaAttribute2.Name = "tableTypeName";
			xmlSchemaAttribute2.FixedValue = "LabelItem_Font1DataTable";
			xmlSchemaComplexType.Attributes.Add(xmlSchemaAttribute2);
			xmlSchemaComplexType.Particle = xmlSchemaSequence;
			XmlSchema schemaSerializable = uIDataSet.GetSchemaSerializable();
			if (xs.Contains(schemaSerializable.TargetNamespace))
			{
				MemoryStream memoryStream = new MemoryStream();
				MemoryStream memoryStream2 = new MemoryStream();
				try
				{
					XmlSchema xmlSchema = null;
					schemaSerializable.Write(memoryStream);
					IEnumerator enumerator = xs.Schemas(schemaSerializable.TargetNamespace).GetEnumerator();
					while (enumerator.MoveNext())
					{
						xmlSchema = (XmlSchema)enumerator.Current;
						memoryStream2.SetLength(0L);
						xmlSchema.Write(memoryStream2);
						if (memoryStream.Length == memoryStream2.Length)
						{
							memoryStream.Position = 0L;
							memoryStream2.Position = 0L;
							while (memoryStream.Position != memoryStream.Length && memoryStream.ReadByte() == memoryStream2.ReadByte())
							{
							}
							if (memoryStream.Position == memoryStream.Length)
							{
								return xmlSchemaComplexType;
							}
						}
					}
				}
				finally
				{
					memoryStream?.Close();
					memoryStream2?.Close();
				}
			}
			xs.Add(schemaSerializable);
			return xmlSchemaComplexType;
		}
	}

	[Serializable]
	[XmlSchemaProvider("GetTypedTableSchema")]
	public class LabelItem_AlignDataTable : DataTable, IEnumerable
	{
		private DataColumn columnValue;

		private DataColumn columnDisplay;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public DataColumn ValueColumn => columnValue;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public DataColumn DisplayColumn => columnDisplay;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[Browsable(false)]
		public int Count => base.Rows.Count;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public LabelItem_AlignRow this[int index] => (LabelItem_AlignRow)base.Rows[index];

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public event LabelItem_AlignRowChangeEventHandler LabelItem_AlignRowChanging;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public event LabelItem_AlignRowChangeEventHandler LabelItem_AlignRowChanged;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public event LabelItem_AlignRowChangeEventHandler LabelItem_AlignRowDeleting;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public event LabelItem_AlignRowChangeEventHandler LabelItem_AlignRowDeleted;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public LabelItem_AlignDataTable()
		{
			base.TableName = "LabelItem_Align";
			BeginInit();
			InitClass();
			EndInit();
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		internal LabelItem_AlignDataTable(DataTable table)
		{
			base.TableName = table.TableName;
			if (table.CaseSensitive != table.DataSet.CaseSensitive)
			{
				base.CaseSensitive = table.CaseSensitive;
			}
			if (table.Locale.ToString() != table.DataSet.Locale.ToString())
			{
				base.Locale = table.Locale;
			}
			if (table.Namespace != table.DataSet.Namespace)
			{
				base.Namespace = table.Namespace;
			}
			base.Prefix = table.Prefix;
			base.MinimumCapacity = table.MinimumCapacity;
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		protected LabelItem_AlignDataTable(SerializationInfo info, StreamingContext context)
			: base(info, context)
		{
			InitVars();
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public void AddLabelItem_AlignRow(LabelItem_AlignRow row)
		{
			base.Rows.Add(row);
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public LabelItem_AlignRow AddLabelItem_AlignRow(int Value, string Display)
		{
			LabelItem_AlignRow labelItem_AlignRow = (LabelItem_AlignRow)NewRow();
			object[] itemArray = new object[2] { Value, Display };
			labelItem_AlignRow.ItemArray = itemArray;
			base.Rows.Add(labelItem_AlignRow);
			return labelItem_AlignRow;
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public LabelItem_AlignRow FindByValue(int Value)
		{
			return (LabelItem_AlignRow)base.Rows.Find(new object[1] { Value });
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public virtual IEnumerator GetEnumerator()
		{
			return base.Rows.GetEnumerator();
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public override DataTable Clone()
		{
			LabelItem_AlignDataTable labelItem_AlignDataTable = (LabelItem_AlignDataTable)base.Clone();
			labelItem_AlignDataTable.InitVars();
			return labelItem_AlignDataTable;
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		protected override DataTable CreateInstance()
		{
			return new LabelItem_AlignDataTable();
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		internal void InitVars()
		{
			columnValue = base.Columns["Value"];
			columnDisplay = base.Columns["Display"];
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		private void InitClass()
		{
			columnValue = new DataColumn("Value", typeof(int), null, MappingType.Element);
			base.Columns.Add(columnValue);
			columnDisplay = new DataColumn("Display", typeof(string), null, MappingType.Element);
			base.Columns.Add(columnDisplay);
			base.Constraints.Add(new UniqueConstraint("Constraint1", new DataColumn[1] { columnValue }, isPrimaryKey: true));
			columnValue.AllowDBNull = false;
			columnValue.Unique = true;
			columnDisplay.AllowDBNull = false;
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public LabelItem_AlignRow NewLabelItem_AlignRow()
		{
			return (LabelItem_AlignRow)NewRow();
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		protected override DataRow NewRowFromBuilder(DataRowBuilder builder)
		{
			return new LabelItem_AlignRow(builder);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		protected override Type GetRowType()
		{
			return typeof(LabelItem_AlignRow);
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		protected override void OnRowChanged(DataRowChangeEventArgs e)
		{
			base.OnRowChanged(e);
			if (this.LabelItem_AlignRowChanged != null)
			{
				this.LabelItem_AlignRowChanged(this, new LabelItem_AlignRowChangeEvent((LabelItem_AlignRow)e.Row, e.Action));
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		protected override void OnRowChanging(DataRowChangeEventArgs e)
		{
			base.OnRowChanging(e);
			if (this.LabelItem_AlignRowChanging != null)
			{
				this.LabelItem_AlignRowChanging(this, new LabelItem_AlignRowChangeEvent((LabelItem_AlignRow)e.Row, e.Action));
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		protected override void OnRowDeleted(DataRowChangeEventArgs e)
		{
			base.OnRowDeleted(e);
			if (this.LabelItem_AlignRowDeleted != null)
			{
				this.LabelItem_AlignRowDeleted(this, new LabelItem_AlignRowChangeEvent((LabelItem_AlignRow)e.Row, e.Action));
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		protected override void OnRowDeleting(DataRowChangeEventArgs e)
		{
			base.OnRowDeleting(e);
			if (this.LabelItem_AlignRowDeleting != null)
			{
				this.LabelItem_AlignRowDeleting(this, new LabelItem_AlignRowChangeEvent((LabelItem_AlignRow)e.Row, e.Action));
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public void RemoveLabelItem_AlignRow(LabelItem_AlignRow row)
		{
			base.Rows.Remove(row);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public static XmlSchemaComplexType GetTypedTableSchema(XmlSchemaSet xs)
		{
			XmlSchemaComplexType xmlSchemaComplexType = new XmlSchemaComplexType();
			XmlSchemaSequence xmlSchemaSequence = new XmlSchemaSequence();
			UIDataSet uIDataSet = new UIDataSet();
			XmlSchemaAny xmlSchemaAny = new XmlSchemaAny();
			xmlSchemaAny.Namespace = "http://www.w3.org/2001/XMLSchema";
			xmlSchemaAny.MinOccurs = 0m;
			xmlSchemaAny.MaxOccurs = decimal.MaxValue;
			xmlSchemaAny.ProcessContents = XmlSchemaContentProcessing.Lax;
			xmlSchemaSequence.Items.Add(xmlSchemaAny);
			XmlSchemaAny xmlSchemaAny2 = new XmlSchemaAny();
			xmlSchemaAny2.Namespace = "urn:schemas-microsoft-com:xml-diffgram-v1";
			xmlSchemaAny2.MinOccurs = 1m;
			xmlSchemaAny2.ProcessContents = XmlSchemaContentProcessing.Lax;
			xmlSchemaSequence.Items.Add(xmlSchemaAny2);
			XmlSchemaAttribute xmlSchemaAttribute = new XmlSchemaAttribute();
			xmlSchemaAttribute.Name = "namespace";
			xmlSchemaAttribute.FixedValue = uIDataSet.Namespace;
			xmlSchemaComplexType.Attributes.Add(xmlSchemaAttribute);
			XmlSchemaAttribute xmlSchemaAttribute2 = new XmlSchemaAttribute();
			xmlSchemaAttribute2.Name = "tableTypeName";
			xmlSchemaAttribute2.FixedValue = "LabelItem_AlignDataTable";
			xmlSchemaComplexType.Attributes.Add(xmlSchemaAttribute2);
			xmlSchemaComplexType.Particle = xmlSchemaSequence;
			XmlSchema schemaSerializable = uIDataSet.GetSchemaSerializable();
			if (xs.Contains(schemaSerializable.TargetNamespace))
			{
				MemoryStream memoryStream = new MemoryStream();
				MemoryStream memoryStream2 = new MemoryStream();
				try
				{
					XmlSchema xmlSchema = null;
					schemaSerializable.Write(memoryStream);
					IEnumerator enumerator = xs.Schemas(schemaSerializable.TargetNamespace).GetEnumerator();
					while (enumerator.MoveNext())
					{
						xmlSchema = (XmlSchema)enumerator.Current;
						memoryStream2.SetLength(0L);
						xmlSchema.Write(memoryStream2);
						if (memoryStream.Length == memoryStream2.Length)
						{
							memoryStream.Position = 0L;
							memoryStream2.Position = 0L;
							while (memoryStream.Position != memoryStream.Length && memoryStream.ReadByte() == memoryStream2.ReadByte())
							{
							}
							if (memoryStream.Position == memoryStream.Length)
							{
								return xmlSchemaComplexType;
							}
						}
					}
				}
				finally
				{
					memoryStream?.Close();
					memoryStream2?.Close();
				}
			}
			xs.Add(schemaSerializable);
			return xmlSchemaComplexType;
		}
	}

	[Serializable]
	[XmlSchemaProvider("GetTypedTableSchema")]
	public class Barcode_SourceDataTable : DataTable, IEnumerable
	{
		private DataColumn columnValue;

		private DataColumn columnDisplay;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public DataColumn ValueColumn => columnValue;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public DataColumn DisplayColumn => columnDisplay;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		[Browsable(false)]
		public int Count => base.Rows.Count;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public Barcode_SourceRow this[int index] => (Barcode_SourceRow)base.Rows[index];

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public event Barcode_SourceRowChangeEventHandler Barcode_SourceRowChanging;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public event Barcode_SourceRowChangeEventHandler Barcode_SourceRowChanged;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public event Barcode_SourceRowChangeEventHandler Barcode_SourceRowDeleting;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public event Barcode_SourceRowChangeEventHandler Barcode_SourceRowDeleted;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public Barcode_SourceDataTable()
		{
			base.TableName = "Barcode_Source";
			BeginInit();
			InitClass();
			EndInit();
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		internal Barcode_SourceDataTable(DataTable table)
		{
			base.TableName = table.TableName;
			if (table.CaseSensitive != table.DataSet.CaseSensitive)
			{
				base.CaseSensitive = table.CaseSensitive;
			}
			if (table.Locale.ToString() != table.DataSet.Locale.ToString())
			{
				base.Locale = table.Locale;
			}
			if (table.Namespace != table.DataSet.Namespace)
			{
				base.Namespace = table.Namespace;
			}
			base.Prefix = table.Prefix;
			base.MinimumCapacity = table.MinimumCapacity;
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		protected Barcode_SourceDataTable(SerializationInfo info, StreamingContext context)
			: base(info, context)
		{
			InitVars();
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public void AddBarcode_SourceRow(Barcode_SourceRow row)
		{
			base.Rows.Add(row);
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public Barcode_SourceRow AddBarcode_SourceRow(int Value, string Display)
		{
			Barcode_SourceRow barcode_SourceRow = (Barcode_SourceRow)NewRow();
			object[] itemArray = new object[2] { Value, Display };
			barcode_SourceRow.ItemArray = itemArray;
			base.Rows.Add(barcode_SourceRow);
			return barcode_SourceRow;
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public Barcode_SourceRow FindByValue(int Value)
		{
			return (Barcode_SourceRow)base.Rows.Find(new object[1] { Value });
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public virtual IEnumerator GetEnumerator()
		{
			return base.Rows.GetEnumerator();
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public override DataTable Clone()
		{
			Barcode_SourceDataTable barcode_SourceDataTable = (Barcode_SourceDataTable)base.Clone();
			barcode_SourceDataTable.InitVars();
			return barcode_SourceDataTable;
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		protected override DataTable CreateInstance()
		{
			return new Barcode_SourceDataTable();
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		internal void InitVars()
		{
			columnValue = base.Columns["Value"];
			columnDisplay = base.Columns["Display"];
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		private void InitClass()
		{
			columnValue = new DataColumn("Value", typeof(int), null, MappingType.Element);
			base.Columns.Add(columnValue);
			columnDisplay = new DataColumn("Display", typeof(string), null, MappingType.Element);
			base.Columns.Add(columnDisplay);
			base.Constraints.Add(new UniqueConstraint("Constraint1", new DataColumn[1] { columnValue }, isPrimaryKey: true));
			columnValue.AllowDBNull = false;
			columnValue.Unique = true;
			columnDisplay.AllowDBNull = false;
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public Barcode_SourceRow NewBarcode_SourceRow()
		{
			return (Barcode_SourceRow)NewRow();
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		protected override DataRow NewRowFromBuilder(DataRowBuilder builder)
		{
			return new Barcode_SourceRow(builder);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		protected override Type GetRowType()
		{
			return typeof(Barcode_SourceRow);
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		protected override void OnRowChanged(DataRowChangeEventArgs e)
		{
			base.OnRowChanged(e);
			if (this.Barcode_SourceRowChanged != null)
			{
				this.Barcode_SourceRowChanged(this, new Barcode_SourceRowChangeEvent((Barcode_SourceRow)e.Row, e.Action));
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		protected override void OnRowChanging(DataRowChangeEventArgs e)
		{
			base.OnRowChanging(e);
			if (this.Barcode_SourceRowChanging != null)
			{
				this.Barcode_SourceRowChanging(this, new Barcode_SourceRowChangeEvent((Barcode_SourceRow)e.Row, e.Action));
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		protected override void OnRowDeleted(DataRowChangeEventArgs e)
		{
			base.OnRowDeleted(e);
			if (this.Barcode_SourceRowDeleted != null)
			{
				this.Barcode_SourceRowDeleted(this, new Barcode_SourceRowChangeEvent((Barcode_SourceRow)e.Row, e.Action));
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		protected override void OnRowDeleting(DataRowChangeEventArgs e)
		{
			base.OnRowDeleting(e);
			if (this.Barcode_SourceRowDeleting != null)
			{
				this.Barcode_SourceRowDeleting(this, new Barcode_SourceRowChangeEvent((Barcode_SourceRow)e.Row, e.Action));
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public void RemoveBarcode_SourceRow(Barcode_SourceRow row)
		{
			base.Rows.Remove(row);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public static XmlSchemaComplexType GetTypedTableSchema(XmlSchemaSet xs)
		{
			XmlSchemaComplexType xmlSchemaComplexType = new XmlSchemaComplexType();
			XmlSchemaSequence xmlSchemaSequence = new XmlSchemaSequence();
			UIDataSet uIDataSet = new UIDataSet();
			XmlSchemaAny xmlSchemaAny = new XmlSchemaAny();
			xmlSchemaAny.Namespace = "http://www.w3.org/2001/XMLSchema";
			xmlSchemaAny.MinOccurs = 0m;
			xmlSchemaAny.MaxOccurs = decimal.MaxValue;
			xmlSchemaAny.ProcessContents = XmlSchemaContentProcessing.Lax;
			xmlSchemaSequence.Items.Add(xmlSchemaAny);
			XmlSchemaAny xmlSchemaAny2 = new XmlSchemaAny();
			xmlSchemaAny2.Namespace = "urn:schemas-microsoft-com:xml-diffgram-v1";
			xmlSchemaAny2.MinOccurs = 1m;
			xmlSchemaAny2.ProcessContents = XmlSchemaContentProcessing.Lax;
			xmlSchemaSequence.Items.Add(xmlSchemaAny2);
			XmlSchemaAttribute xmlSchemaAttribute = new XmlSchemaAttribute();
			xmlSchemaAttribute.Name = "namespace";
			xmlSchemaAttribute.FixedValue = uIDataSet.Namespace;
			xmlSchemaComplexType.Attributes.Add(xmlSchemaAttribute);
			XmlSchemaAttribute xmlSchemaAttribute2 = new XmlSchemaAttribute();
			xmlSchemaAttribute2.Name = "tableTypeName";
			xmlSchemaAttribute2.FixedValue = "Barcode_SourceDataTable";
			xmlSchemaComplexType.Attributes.Add(xmlSchemaAttribute2);
			xmlSchemaComplexType.Particle = xmlSchemaSequence;
			XmlSchema schemaSerializable = uIDataSet.GetSchemaSerializable();
			if (xs.Contains(schemaSerializable.TargetNamespace))
			{
				MemoryStream memoryStream = new MemoryStream();
				MemoryStream memoryStream2 = new MemoryStream();
				try
				{
					XmlSchema xmlSchema = null;
					schemaSerializable.Write(memoryStream);
					IEnumerator enumerator = xs.Schemas(schemaSerializable.TargetNamespace).GetEnumerator();
					while (enumerator.MoveNext())
					{
						xmlSchema = (XmlSchema)enumerator.Current;
						memoryStream2.SetLength(0L);
						xmlSchema.Write(memoryStream2);
						if (memoryStream.Length == memoryStream2.Length)
						{
							memoryStream.Position = 0L;
							memoryStream2.Position = 0L;
							while (memoryStream.Position != memoryStream.Length && memoryStream.ReadByte() == memoryStream2.ReadByte())
							{
							}
							if (memoryStream.Position == memoryStream.Length)
							{
								return xmlSchemaComplexType;
							}
						}
					}
				}
				finally
				{
					memoryStream?.Close();
					memoryStream2?.Close();
				}
			}
			xs.Add(schemaSerializable);
			return xmlSchemaComplexType;
		}
	}

	[Serializable]
	[XmlSchemaProvider("GetTypedTableSchema")]
	public class Barcode_OverDataTable : DataTable, IEnumerable
	{
		private DataColumn columnValue;

		private DataColumn columnDisplay;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public DataColumn ValueColumn => columnValue;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public DataColumn DisplayColumn => columnDisplay;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		[Browsable(false)]
		public int Count => base.Rows.Count;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public Barcode_OverRow this[int index] => (Barcode_OverRow)base.Rows[index];

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public event Barcode_OverRowChangeEventHandler Barcode_OverRowChanging;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public event Barcode_OverRowChangeEventHandler Barcode_OverRowChanged;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public event Barcode_OverRowChangeEventHandler Barcode_OverRowDeleting;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public event Barcode_OverRowChangeEventHandler Barcode_OverRowDeleted;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public Barcode_OverDataTable()
		{
			base.TableName = "Barcode_Over";
			BeginInit();
			InitClass();
			EndInit();
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		internal Barcode_OverDataTable(DataTable table)
		{
			base.TableName = table.TableName;
			if (table.CaseSensitive != table.DataSet.CaseSensitive)
			{
				base.CaseSensitive = table.CaseSensitive;
			}
			if (table.Locale.ToString() != table.DataSet.Locale.ToString())
			{
				base.Locale = table.Locale;
			}
			if (table.Namespace != table.DataSet.Namespace)
			{
				base.Namespace = table.Namespace;
			}
			base.Prefix = table.Prefix;
			base.MinimumCapacity = table.MinimumCapacity;
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		protected Barcode_OverDataTable(SerializationInfo info, StreamingContext context)
			: base(info, context)
		{
			InitVars();
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public void AddBarcode_OverRow(Barcode_OverRow row)
		{
			base.Rows.Add(row);
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public Barcode_OverRow AddBarcode_OverRow(int Value, string Display)
		{
			Barcode_OverRow barcode_OverRow = (Barcode_OverRow)NewRow();
			object[] itemArray = new object[2] { Value, Display };
			barcode_OverRow.ItemArray = itemArray;
			base.Rows.Add(barcode_OverRow);
			return barcode_OverRow;
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public Barcode_OverRow FindByValue(int Value)
		{
			return (Barcode_OverRow)base.Rows.Find(new object[1] { Value });
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public virtual IEnumerator GetEnumerator()
		{
			return base.Rows.GetEnumerator();
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public override DataTable Clone()
		{
			Barcode_OverDataTable barcode_OverDataTable = (Barcode_OverDataTable)base.Clone();
			barcode_OverDataTable.InitVars();
			return barcode_OverDataTable;
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		protected override DataTable CreateInstance()
		{
			return new Barcode_OverDataTable();
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		internal void InitVars()
		{
			columnValue = base.Columns["Value"];
			columnDisplay = base.Columns["Display"];
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		private void InitClass()
		{
			columnValue = new DataColumn("Value", typeof(int), null, MappingType.Element);
			base.Columns.Add(columnValue);
			columnDisplay = new DataColumn("Display", typeof(string), null, MappingType.Element);
			base.Columns.Add(columnDisplay);
			base.Constraints.Add(new UniqueConstraint("Constraint1", new DataColumn[1] { columnValue }, isPrimaryKey: true));
			columnValue.AllowDBNull = false;
			columnValue.Unique = true;
			columnDisplay.AllowDBNull = false;
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public Barcode_OverRow NewBarcode_OverRow()
		{
			return (Barcode_OverRow)NewRow();
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		protected override DataRow NewRowFromBuilder(DataRowBuilder builder)
		{
			return new Barcode_OverRow(builder);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		protected override Type GetRowType()
		{
			return typeof(Barcode_OverRow);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		protected override void OnRowChanged(DataRowChangeEventArgs e)
		{
			base.OnRowChanged(e);
			if (this.Barcode_OverRowChanged != null)
			{
				this.Barcode_OverRowChanged(this, new Barcode_OverRowChangeEvent((Barcode_OverRow)e.Row, e.Action));
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		protected override void OnRowChanging(DataRowChangeEventArgs e)
		{
			base.OnRowChanging(e);
			if (this.Barcode_OverRowChanging != null)
			{
				this.Barcode_OverRowChanging(this, new Barcode_OverRowChangeEvent((Barcode_OverRow)e.Row, e.Action));
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		protected override void OnRowDeleted(DataRowChangeEventArgs e)
		{
			base.OnRowDeleted(e);
			if (this.Barcode_OverRowDeleted != null)
			{
				this.Barcode_OverRowDeleted(this, new Barcode_OverRowChangeEvent((Barcode_OverRow)e.Row, e.Action));
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		protected override void OnRowDeleting(DataRowChangeEventArgs e)
		{
			base.OnRowDeleting(e);
			if (this.Barcode_OverRowDeleting != null)
			{
				this.Barcode_OverRowDeleting(this, new Barcode_OverRowChangeEvent((Barcode_OverRow)e.Row, e.Action));
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public void RemoveBarcode_OverRow(Barcode_OverRow row)
		{
			base.Rows.Remove(row);
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public static XmlSchemaComplexType GetTypedTableSchema(XmlSchemaSet xs)
		{
			XmlSchemaComplexType xmlSchemaComplexType = new XmlSchemaComplexType();
			XmlSchemaSequence xmlSchemaSequence = new XmlSchemaSequence();
			UIDataSet uIDataSet = new UIDataSet();
			XmlSchemaAny xmlSchemaAny = new XmlSchemaAny();
			xmlSchemaAny.Namespace = "http://www.w3.org/2001/XMLSchema";
			xmlSchemaAny.MinOccurs = 0m;
			xmlSchemaAny.MaxOccurs = decimal.MaxValue;
			xmlSchemaAny.ProcessContents = XmlSchemaContentProcessing.Lax;
			xmlSchemaSequence.Items.Add(xmlSchemaAny);
			XmlSchemaAny xmlSchemaAny2 = new XmlSchemaAny();
			xmlSchemaAny2.Namespace = "urn:schemas-microsoft-com:xml-diffgram-v1";
			xmlSchemaAny2.MinOccurs = 1m;
			xmlSchemaAny2.ProcessContents = XmlSchemaContentProcessing.Lax;
			xmlSchemaSequence.Items.Add(xmlSchemaAny2);
			XmlSchemaAttribute xmlSchemaAttribute = new XmlSchemaAttribute();
			xmlSchemaAttribute.Name = "namespace";
			xmlSchemaAttribute.FixedValue = uIDataSet.Namespace;
			xmlSchemaComplexType.Attributes.Add(xmlSchemaAttribute);
			XmlSchemaAttribute xmlSchemaAttribute2 = new XmlSchemaAttribute();
			xmlSchemaAttribute2.Name = "tableTypeName";
			xmlSchemaAttribute2.FixedValue = "Barcode_OverDataTable";
			xmlSchemaComplexType.Attributes.Add(xmlSchemaAttribute2);
			xmlSchemaComplexType.Particle = xmlSchemaSequence;
			XmlSchema schemaSerializable = uIDataSet.GetSchemaSerializable();
			if (xs.Contains(schemaSerializable.TargetNamespace))
			{
				MemoryStream memoryStream = new MemoryStream();
				MemoryStream memoryStream2 = new MemoryStream();
				try
				{
					XmlSchema xmlSchema = null;
					schemaSerializable.Write(memoryStream);
					IEnumerator enumerator = xs.Schemas(schemaSerializable.TargetNamespace).GetEnumerator();
					while (enumerator.MoveNext())
					{
						xmlSchema = (XmlSchema)enumerator.Current;
						memoryStream2.SetLength(0L);
						xmlSchema.Write(memoryStream2);
						if (memoryStream.Length == memoryStream2.Length)
						{
							memoryStream.Position = 0L;
							memoryStream2.Position = 0L;
							while (memoryStream.Position != memoryStream.Length && memoryStream.ReadByte() == memoryStream2.ReadByte())
							{
							}
							if (memoryStream.Position == memoryStream.Length)
							{
								return xmlSchemaComplexType;
							}
						}
					}
				}
				finally
				{
					memoryStream?.Close();
					memoryStream2?.Close();
				}
			}
			xs.Add(schemaSerializable);
			return xmlSchemaComplexType;
		}
	}

	[Serializable]
	[XmlSchemaProvider("GetTypedTableSchema")]
	public class Barcode_FormatDataTable : DataTable, IEnumerable
	{
		private DataColumn columnValue;

		private DataColumn columnDisplay;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public DataColumn ValueColumn => columnValue;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public DataColumn DisplayColumn => columnDisplay;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[Browsable(false)]
		[DebuggerNonUserCode]
		public int Count => base.Rows.Count;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public Barcode_FormatRow this[int index] => (Barcode_FormatRow)base.Rows[index];

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public event Barcode_FormatRowChangeEventHandler Barcode_FormatRowChanging;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public event Barcode_FormatRowChangeEventHandler Barcode_FormatRowChanged;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public event Barcode_FormatRowChangeEventHandler Barcode_FormatRowDeleting;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public event Barcode_FormatRowChangeEventHandler Barcode_FormatRowDeleted;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public Barcode_FormatDataTable()
		{
			base.TableName = "Barcode_Format";
			BeginInit();
			InitClass();
			EndInit();
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		internal Barcode_FormatDataTable(DataTable table)
		{
			base.TableName = table.TableName;
			if (table.CaseSensitive != table.DataSet.CaseSensitive)
			{
				base.CaseSensitive = table.CaseSensitive;
			}
			if (table.Locale.ToString() != table.DataSet.Locale.ToString())
			{
				base.Locale = table.Locale;
			}
			if (table.Namespace != table.DataSet.Namespace)
			{
				base.Namespace = table.Namespace;
			}
			base.Prefix = table.Prefix;
			base.MinimumCapacity = table.MinimumCapacity;
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		protected Barcode_FormatDataTable(SerializationInfo info, StreamingContext context)
			: base(info, context)
		{
			InitVars();
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public void AddBarcode_FormatRow(Barcode_FormatRow row)
		{
			base.Rows.Add(row);
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public Barcode_FormatRow AddBarcode_FormatRow(int Value, string Display)
		{
			Barcode_FormatRow barcode_FormatRow = (Barcode_FormatRow)NewRow();
			object[] itemArray = new object[2] { Value, Display };
			barcode_FormatRow.ItemArray = itemArray;
			base.Rows.Add(barcode_FormatRow);
			return barcode_FormatRow;
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public Barcode_FormatRow FindByValue(int Value)
		{
			return (Barcode_FormatRow)base.Rows.Find(new object[1] { Value });
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public virtual IEnumerator GetEnumerator()
		{
			return base.Rows.GetEnumerator();
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public override DataTable Clone()
		{
			Barcode_FormatDataTable barcode_FormatDataTable = (Barcode_FormatDataTable)base.Clone();
			barcode_FormatDataTable.InitVars();
			return barcode_FormatDataTable;
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		protected override DataTable CreateInstance()
		{
			return new Barcode_FormatDataTable();
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		internal void InitVars()
		{
			columnValue = base.Columns["Value"];
			columnDisplay = base.Columns["Display"];
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		private void InitClass()
		{
			columnValue = new DataColumn("Value", typeof(int), null, MappingType.Element);
			base.Columns.Add(columnValue);
			columnDisplay = new DataColumn("Display", typeof(string), null, MappingType.Element);
			base.Columns.Add(columnDisplay);
			base.Constraints.Add(new UniqueConstraint("Constraint1", new DataColumn[1] { columnValue }, isPrimaryKey: true));
			columnValue.AllowDBNull = false;
			columnValue.Unique = true;
			columnDisplay.AllowDBNull = false;
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public Barcode_FormatRow NewBarcode_FormatRow()
		{
			return (Barcode_FormatRow)NewRow();
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		protected override DataRow NewRowFromBuilder(DataRowBuilder builder)
		{
			return new Barcode_FormatRow(builder);
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		protected override Type GetRowType()
		{
			return typeof(Barcode_FormatRow);
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		protected override void OnRowChanged(DataRowChangeEventArgs e)
		{
			base.OnRowChanged(e);
			if (this.Barcode_FormatRowChanged != null)
			{
				this.Barcode_FormatRowChanged(this, new Barcode_FormatRowChangeEvent((Barcode_FormatRow)e.Row, e.Action));
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		protected override void OnRowChanging(DataRowChangeEventArgs e)
		{
			base.OnRowChanging(e);
			if (this.Barcode_FormatRowChanging != null)
			{
				this.Barcode_FormatRowChanging(this, new Barcode_FormatRowChangeEvent((Barcode_FormatRow)e.Row, e.Action));
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		protected override void OnRowDeleted(DataRowChangeEventArgs e)
		{
			base.OnRowDeleted(e);
			if (this.Barcode_FormatRowDeleted != null)
			{
				this.Barcode_FormatRowDeleted(this, new Barcode_FormatRowChangeEvent((Barcode_FormatRow)e.Row, e.Action));
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		protected override void OnRowDeleting(DataRowChangeEventArgs e)
		{
			base.OnRowDeleting(e);
			if (this.Barcode_FormatRowDeleting != null)
			{
				this.Barcode_FormatRowDeleting(this, new Barcode_FormatRowChangeEvent((Barcode_FormatRow)e.Row, e.Action));
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public void RemoveBarcode_FormatRow(Barcode_FormatRow row)
		{
			base.Rows.Remove(row);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public static XmlSchemaComplexType GetTypedTableSchema(XmlSchemaSet xs)
		{
			XmlSchemaComplexType xmlSchemaComplexType = new XmlSchemaComplexType();
			XmlSchemaSequence xmlSchemaSequence = new XmlSchemaSequence();
			UIDataSet uIDataSet = new UIDataSet();
			XmlSchemaAny xmlSchemaAny = new XmlSchemaAny();
			xmlSchemaAny.Namespace = "http://www.w3.org/2001/XMLSchema";
			xmlSchemaAny.MinOccurs = 0m;
			xmlSchemaAny.MaxOccurs = decimal.MaxValue;
			xmlSchemaAny.ProcessContents = XmlSchemaContentProcessing.Lax;
			xmlSchemaSequence.Items.Add(xmlSchemaAny);
			XmlSchemaAny xmlSchemaAny2 = new XmlSchemaAny();
			xmlSchemaAny2.Namespace = "urn:schemas-microsoft-com:xml-diffgram-v1";
			xmlSchemaAny2.MinOccurs = 1m;
			xmlSchemaAny2.ProcessContents = XmlSchemaContentProcessing.Lax;
			xmlSchemaSequence.Items.Add(xmlSchemaAny2);
			XmlSchemaAttribute xmlSchemaAttribute = new XmlSchemaAttribute();
			xmlSchemaAttribute.Name = "namespace";
			xmlSchemaAttribute.FixedValue = uIDataSet.Namespace;
			xmlSchemaComplexType.Attributes.Add(xmlSchemaAttribute);
			XmlSchemaAttribute xmlSchemaAttribute2 = new XmlSchemaAttribute();
			xmlSchemaAttribute2.Name = "tableTypeName";
			xmlSchemaAttribute2.FixedValue = "Barcode_FormatDataTable";
			xmlSchemaComplexType.Attributes.Add(xmlSchemaAttribute2);
			xmlSchemaComplexType.Particle = xmlSchemaSequence;
			XmlSchema schemaSerializable = uIDataSet.GetSchemaSerializable();
			if (xs.Contains(schemaSerializable.TargetNamespace))
			{
				MemoryStream memoryStream = new MemoryStream();
				MemoryStream memoryStream2 = new MemoryStream();
				try
				{
					XmlSchema xmlSchema = null;
					schemaSerializable.Write(memoryStream);
					IEnumerator enumerator = xs.Schemas(schemaSerializable.TargetNamespace).GetEnumerator();
					while (enumerator.MoveNext())
					{
						xmlSchema = (XmlSchema)enumerator.Current;
						memoryStream2.SetLength(0L);
						xmlSchema.Write(memoryStream2);
						if (memoryStream.Length == memoryStream2.Length)
						{
							memoryStream.Position = 0L;
							memoryStream2.Position = 0L;
							while (memoryStream.Position != memoryStream.Length && memoryStream.ReadByte() == memoryStream2.ReadByte())
							{
							}
							if (memoryStream.Position == memoryStream.Length)
							{
								return xmlSchemaComplexType;
							}
						}
					}
				}
				finally
				{
					memoryStream?.Close();
					memoryStream2?.Close();
				}
			}
			xs.Add(schemaSerializable);
			return xmlSchemaComplexType;
		}
	}

	[Serializable]
	[XmlSchemaProvider("GetTypedTableSchema")]
	public class Barcode_CheckDataTable : DataTable, IEnumerable
	{
		private DataColumn columnValue;

		private DataColumn columnDisplay;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public DataColumn ValueColumn => columnValue;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public DataColumn DisplayColumn => columnDisplay;

		[DebuggerNonUserCode]
		[Browsable(false)]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public int Count => base.Rows.Count;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public Barcode_CheckRow this[int index] => (Barcode_CheckRow)base.Rows[index];

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public event Barcode_CheckRowChangeEventHandler Barcode_CheckRowChanging;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public event Barcode_CheckRowChangeEventHandler Barcode_CheckRowChanged;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public event Barcode_CheckRowChangeEventHandler Barcode_CheckRowDeleting;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public event Barcode_CheckRowChangeEventHandler Barcode_CheckRowDeleted;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public Barcode_CheckDataTable()
		{
			base.TableName = "Barcode_Check";
			BeginInit();
			InitClass();
			EndInit();
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		internal Barcode_CheckDataTable(DataTable table)
		{
			base.TableName = table.TableName;
			if (table.CaseSensitive != table.DataSet.CaseSensitive)
			{
				base.CaseSensitive = table.CaseSensitive;
			}
			if (table.Locale.ToString() != table.DataSet.Locale.ToString())
			{
				base.Locale = table.Locale;
			}
			if (table.Namespace != table.DataSet.Namespace)
			{
				base.Namespace = table.Namespace;
			}
			base.Prefix = table.Prefix;
			base.MinimumCapacity = table.MinimumCapacity;
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		protected Barcode_CheckDataTable(SerializationInfo info, StreamingContext context)
			: base(info, context)
		{
			InitVars();
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public void AddBarcode_CheckRow(Barcode_CheckRow row)
		{
			base.Rows.Add(row);
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public Barcode_CheckRow AddBarcode_CheckRow(int Value, string Display)
		{
			Barcode_CheckRow barcode_CheckRow = (Barcode_CheckRow)NewRow();
			object[] itemArray = new object[2] { Value, Display };
			barcode_CheckRow.ItemArray = itemArray;
			base.Rows.Add(barcode_CheckRow);
			return barcode_CheckRow;
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public Barcode_CheckRow FindByValue(int Value)
		{
			return (Barcode_CheckRow)base.Rows.Find(new object[1] { Value });
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public virtual IEnumerator GetEnumerator()
		{
			return base.Rows.GetEnumerator();
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public override DataTable Clone()
		{
			Barcode_CheckDataTable barcode_CheckDataTable = (Barcode_CheckDataTable)base.Clone();
			barcode_CheckDataTable.InitVars();
			return barcode_CheckDataTable;
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		protected override DataTable CreateInstance()
		{
			return new Barcode_CheckDataTable();
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		internal void InitVars()
		{
			columnValue = base.Columns["Value"];
			columnDisplay = base.Columns["Display"];
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		private void InitClass()
		{
			columnValue = new DataColumn("Value", typeof(int), null, MappingType.Element);
			base.Columns.Add(columnValue);
			columnDisplay = new DataColumn("Display", typeof(string), null, MappingType.Element);
			base.Columns.Add(columnDisplay);
			base.Constraints.Add(new UniqueConstraint("Constraint1", new DataColumn[1] { columnValue }, isPrimaryKey: true));
			columnValue.AllowDBNull = false;
			columnValue.Unique = true;
			columnDisplay.AllowDBNull = false;
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public Barcode_CheckRow NewBarcode_CheckRow()
		{
			return (Barcode_CheckRow)NewRow();
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		protected override DataRow NewRowFromBuilder(DataRowBuilder builder)
		{
			return new Barcode_CheckRow(builder);
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		protected override Type GetRowType()
		{
			return typeof(Barcode_CheckRow);
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		protected override void OnRowChanged(DataRowChangeEventArgs e)
		{
			base.OnRowChanged(e);
			if (this.Barcode_CheckRowChanged != null)
			{
				this.Barcode_CheckRowChanged(this, new Barcode_CheckRowChangeEvent((Barcode_CheckRow)e.Row, e.Action));
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		protected override void OnRowChanging(DataRowChangeEventArgs e)
		{
			base.OnRowChanging(e);
			if (this.Barcode_CheckRowChanging != null)
			{
				this.Barcode_CheckRowChanging(this, new Barcode_CheckRowChangeEvent((Barcode_CheckRow)e.Row, e.Action));
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		protected override void OnRowDeleted(DataRowChangeEventArgs e)
		{
			base.OnRowDeleted(e);
			if (this.Barcode_CheckRowDeleted != null)
			{
				this.Barcode_CheckRowDeleted(this, new Barcode_CheckRowChangeEvent((Barcode_CheckRow)e.Row, e.Action));
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		protected override void OnRowDeleting(DataRowChangeEventArgs e)
		{
			base.OnRowDeleting(e);
			if (this.Barcode_CheckRowDeleting != null)
			{
				this.Barcode_CheckRowDeleting(this, new Barcode_CheckRowChangeEvent((Barcode_CheckRow)e.Row, e.Action));
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public void RemoveBarcode_CheckRow(Barcode_CheckRow row)
		{
			base.Rows.Remove(row);
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public static XmlSchemaComplexType GetTypedTableSchema(XmlSchemaSet xs)
		{
			XmlSchemaComplexType xmlSchemaComplexType = new XmlSchemaComplexType();
			XmlSchemaSequence xmlSchemaSequence = new XmlSchemaSequence();
			UIDataSet uIDataSet = new UIDataSet();
			XmlSchemaAny xmlSchemaAny = new XmlSchemaAny();
			xmlSchemaAny.Namespace = "http://www.w3.org/2001/XMLSchema";
			xmlSchemaAny.MinOccurs = 0m;
			xmlSchemaAny.MaxOccurs = decimal.MaxValue;
			xmlSchemaAny.ProcessContents = XmlSchemaContentProcessing.Lax;
			xmlSchemaSequence.Items.Add(xmlSchemaAny);
			XmlSchemaAny xmlSchemaAny2 = new XmlSchemaAny();
			xmlSchemaAny2.Namespace = "urn:schemas-microsoft-com:xml-diffgram-v1";
			xmlSchemaAny2.MinOccurs = 1m;
			xmlSchemaAny2.ProcessContents = XmlSchemaContentProcessing.Lax;
			xmlSchemaSequence.Items.Add(xmlSchemaAny2);
			XmlSchemaAttribute xmlSchemaAttribute = new XmlSchemaAttribute();
			xmlSchemaAttribute.Name = "namespace";
			xmlSchemaAttribute.FixedValue = uIDataSet.Namespace;
			xmlSchemaComplexType.Attributes.Add(xmlSchemaAttribute);
			XmlSchemaAttribute xmlSchemaAttribute2 = new XmlSchemaAttribute();
			xmlSchemaAttribute2.Name = "tableTypeName";
			xmlSchemaAttribute2.FixedValue = "Barcode_CheckDataTable";
			xmlSchemaComplexType.Attributes.Add(xmlSchemaAttribute2);
			xmlSchemaComplexType.Particle = xmlSchemaSequence;
			XmlSchema schemaSerializable = uIDataSet.GetSchemaSerializable();
			if (xs.Contains(schemaSerializable.TargetNamespace))
			{
				MemoryStream memoryStream = new MemoryStream();
				MemoryStream memoryStream2 = new MemoryStream();
				try
				{
					XmlSchema xmlSchema = null;
					schemaSerializable.Write(memoryStream);
					IEnumerator enumerator = xs.Schemas(schemaSerializable.TargetNamespace).GetEnumerator();
					while (enumerator.MoveNext())
					{
						xmlSchema = (XmlSchema)enumerator.Current;
						memoryStream2.SetLength(0L);
						xmlSchema.Write(memoryStream2);
						if (memoryStream.Length == memoryStream2.Length)
						{
							memoryStream.Position = 0L;
							memoryStream2.Position = 0L;
							while (memoryStream.Position != memoryStream.Length && memoryStream.ReadByte() == memoryStream2.ReadByte())
							{
							}
							if (memoryStream.Position == memoryStream.Length)
							{
								return xmlSchemaComplexType;
							}
						}
					}
				}
				finally
				{
					memoryStream?.Close();
					memoryStream2?.Close();
				}
			}
			xs.Add(schemaSerializable);
			return xmlSchemaComplexType;
		}
	}

	[Serializable]
	[XmlSchemaProvider("GetTypedTableSchema")]
	public class Label_SortDataTable : DataTable, IEnumerable
	{
		private DataColumn columnValue;

		private DataColumn columnDisplay;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public DataColumn ValueColumn => columnValue;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public DataColumn DisplayColumn => columnDisplay;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[Browsable(false)]
		[DebuggerNonUserCode]
		public int Count => base.Rows.Count;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public Label_SortRow this[int index] => (Label_SortRow)base.Rows[index];

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public event Label_SortRowChangeEventHandler Label_SortRowChanging;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public event Label_SortRowChangeEventHandler Label_SortRowChanged;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public event Label_SortRowChangeEventHandler Label_SortRowDeleting;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public event Label_SortRowChangeEventHandler Label_SortRowDeleted;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public Label_SortDataTable()
		{
			base.TableName = "Label_Sort";
			BeginInit();
			InitClass();
			EndInit();
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		internal Label_SortDataTable(DataTable table)
		{
			base.TableName = table.TableName;
			if (table.CaseSensitive != table.DataSet.CaseSensitive)
			{
				base.CaseSensitive = table.CaseSensitive;
			}
			if (table.Locale.ToString() != table.DataSet.Locale.ToString())
			{
				base.Locale = table.Locale;
			}
			if (table.Namespace != table.DataSet.Namespace)
			{
				base.Namespace = table.Namespace;
			}
			base.Prefix = table.Prefix;
			base.MinimumCapacity = table.MinimumCapacity;
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		protected Label_SortDataTable(SerializationInfo info, StreamingContext context)
			: base(info, context)
		{
			InitVars();
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public void AddLabel_SortRow(Label_SortRow row)
		{
			base.Rows.Add(row);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public Label_SortRow AddLabel_SortRow(int Value, string Display)
		{
			Label_SortRow label_SortRow = (Label_SortRow)NewRow();
			object[] itemArray = new object[2] { Value, Display };
			label_SortRow.ItemArray = itemArray;
			base.Rows.Add(label_SortRow);
			return label_SortRow;
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public Label_SortRow FindByValue(int Value)
		{
			return (Label_SortRow)base.Rows.Find(new object[1] { Value });
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public virtual IEnumerator GetEnumerator()
		{
			return base.Rows.GetEnumerator();
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public override DataTable Clone()
		{
			Label_SortDataTable label_SortDataTable = (Label_SortDataTable)base.Clone();
			label_SortDataTable.InitVars();
			return label_SortDataTable;
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		protected override DataTable CreateInstance()
		{
			return new Label_SortDataTable();
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		internal void InitVars()
		{
			columnValue = base.Columns["Value"];
			columnDisplay = base.Columns["Display"];
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		private void InitClass()
		{
			columnValue = new DataColumn("Value", typeof(int), null, MappingType.Element);
			base.Columns.Add(columnValue);
			columnDisplay = new DataColumn("Display", typeof(string), null, MappingType.Element);
			base.Columns.Add(columnDisplay);
			base.Constraints.Add(new UniqueConstraint("Constraint1", new DataColumn[1] { columnValue }, isPrimaryKey: true));
			columnValue.AllowDBNull = false;
			columnValue.Unique = true;
			columnDisplay.AllowDBNull = false;
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public Label_SortRow NewLabel_SortRow()
		{
			return (Label_SortRow)NewRow();
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		protected override DataRow NewRowFromBuilder(DataRowBuilder builder)
		{
			return new Label_SortRow(builder);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		protected override Type GetRowType()
		{
			return typeof(Label_SortRow);
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		protected override void OnRowChanged(DataRowChangeEventArgs e)
		{
			base.OnRowChanged(e);
			if (this.Label_SortRowChanged != null)
			{
				this.Label_SortRowChanged(this, new Label_SortRowChangeEvent((Label_SortRow)e.Row, e.Action));
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		protected override void OnRowChanging(DataRowChangeEventArgs e)
		{
			base.OnRowChanging(e);
			if (this.Label_SortRowChanging != null)
			{
				this.Label_SortRowChanging(this, new Label_SortRowChangeEvent((Label_SortRow)e.Row, e.Action));
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		protected override void OnRowDeleted(DataRowChangeEventArgs e)
		{
			base.OnRowDeleted(e);
			if (this.Label_SortRowDeleted != null)
			{
				this.Label_SortRowDeleted(this, new Label_SortRowChangeEvent((Label_SortRow)e.Row, e.Action));
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		protected override void OnRowDeleting(DataRowChangeEventArgs e)
		{
			base.OnRowDeleting(e);
			if (this.Label_SortRowDeleting != null)
			{
				this.Label_SortRowDeleting(this, new Label_SortRowChangeEvent((Label_SortRow)e.Row, e.Action));
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public void RemoveLabel_SortRow(Label_SortRow row)
		{
			base.Rows.Remove(row);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public static XmlSchemaComplexType GetTypedTableSchema(XmlSchemaSet xs)
		{
			XmlSchemaComplexType xmlSchemaComplexType = new XmlSchemaComplexType();
			XmlSchemaSequence xmlSchemaSequence = new XmlSchemaSequence();
			UIDataSet uIDataSet = new UIDataSet();
			XmlSchemaAny xmlSchemaAny = new XmlSchemaAny();
			xmlSchemaAny.Namespace = "http://www.w3.org/2001/XMLSchema";
			xmlSchemaAny.MinOccurs = 0m;
			xmlSchemaAny.MaxOccurs = decimal.MaxValue;
			xmlSchemaAny.ProcessContents = XmlSchemaContentProcessing.Lax;
			xmlSchemaSequence.Items.Add(xmlSchemaAny);
			XmlSchemaAny xmlSchemaAny2 = new XmlSchemaAny();
			xmlSchemaAny2.Namespace = "urn:schemas-microsoft-com:xml-diffgram-v1";
			xmlSchemaAny2.MinOccurs = 1m;
			xmlSchemaAny2.ProcessContents = XmlSchemaContentProcessing.Lax;
			xmlSchemaSequence.Items.Add(xmlSchemaAny2);
			XmlSchemaAttribute xmlSchemaAttribute = new XmlSchemaAttribute();
			xmlSchemaAttribute.Name = "namespace";
			xmlSchemaAttribute.FixedValue = uIDataSet.Namespace;
			xmlSchemaComplexType.Attributes.Add(xmlSchemaAttribute);
			XmlSchemaAttribute xmlSchemaAttribute2 = new XmlSchemaAttribute();
			xmlSchemaAttribute2.Name = "tableTypeName";
			xmlSchemaAttribute2.FixedValue = "Label_SortDataTable";
			xmlSchemaComplexType.Attributes.Add(xmlSchemaAttribute2);
			xmlSchemaComplexType.Particle = xmlSchemaSequence;
			XmlSchema schemaSerializable = uIDataSet.GetSchemaSerializable();
			if (xs.Contains(schemaSerializable.TargetNamespace))
			{
				MemoryStream memoryStream = new MemoryStream();
				MemoryStream memoryStream2 = new MemoryStream();
				try
				{
					XmlSchema xmlSchema = null;
					schemaSerializable.Write(memoryStream);
					IEnumerator enumerator = xs.Schemas(schemaSerializable.TargetNamespace).GetEnumerator();
					while (enumerator.MoveNext())
					{
						xmlSchema = (XmlSchema)enumerator.Current;
						memoryStream2.SetLength(0L);
						xmlSchema.Write(memoryStream2);
						if (memoryStream.Length == memoryStream2.Length)
						{
							memoryStream.Position = 0L;
							memoryStream2.Position = 0L;
							while (memoryStream.Position != memoryStream.Length && memoryStream.ReadByte() == memoryStream2.ReadByte())
							{
							}
							if (memoryStream.Position == memoryStream.Length)
							{
								return xmlSchemaComplexType;
							}
						}
					}
				}
				finally
				{
					memoryStream?.Close();
					memoryStream2?.Close();
				}
			}
			xs.Add(schemaSerializable);
			return xmlSchemaComplexType;
		}
	}

	[Serializable]
	[XmlSchemaProvider("GetTypedTableSchema")]
	public class String_InfoDataTable : DataTable, IEnumerable
	{
		private DataColumn columnStringID;

		private DataColumn columnDisplay;

		private DataColumn columnVisible;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public DataColumn StringIDColumn => columnStringID;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public DataColumn DisplayColumn => columnDisplay;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public DataColumn VisibleColumn => columnVisible;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[Browsable(false)]
		[DebuggerNonUserCode]
		public int Count => base.Rows.Count;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public String_InfoRow this[int index] => (String_InfoRow)base.Rows[index];

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public event String_InfoRowChangeEventHandler String_InfoRowChanging;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public event String_InfoRowChangeEventHandler String_InfoRowChanged;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public event String_InfoRowChangeEventHandler String_InfoRowDeleting;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public event String_InfoRowChangeEventHandler String_InfoRowDeleted;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public String_InfoDataTable()
		{
			base.TableName = "String_Info";
			BeginInit();
			InitClass();
			EndInit();
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		internal String_InfoDataTable(DataTable table)
		{
			base.TableName = table.TableName;
			if (table.CaseSensitive != table.DataSet.CaseSensitive)
			{
				base.CaseSensitive = table.CaseSensitive;
			}
			if (table.Locale.ToString() != table.DataSet.Locale.ToString())
			{
				base.Locale = table.Locale;
			}
			if (table.Namespace != table.DataSet.Namespace)
			{
				base.Namespace = table.Namespace;
			}
			base.Prefix = table.Prefix;
			base.MinimumCapacity = table.MinimumCapacity;
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		protected String_InfoDataTable(SerializationInfo info, StreamingContext context)
			: base(info, context)
		{
			InitVars();
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public void AddString_InfoRow(String_InfoRow row)
		{
			base.Rows.Add(row);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public String_InfoRow AddString_InfoRow(int StringID, string Display, string Visible)
		{
			String_InfoRow string_InfoRow = (String_InfoRow)NewRow();
			object[] itemArray = new object[3] { StringID, Display, Visible };
			string_InfoRow.ItemArray = itemArray;
			base.Rows.Add(string_InfoRow);
			return string_InfoRow;
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public String_InfoRow FindByStringID(int StringID)
		{
			return (String_InfoRow)base.Rows.Find(new object[1] { StringID });
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public virtual IEnumerator GetEnumerator()
		{
			return base.Rows.GetEnumerator();
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public override DataTable Clone()
		{
			String_InfoDataTable string_InfoDataTable = (String_InfoDataTable)base.Clone();
			string_InfoDataTable.InitVars();
			return string_InfoDataTable;
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		protected override DataTable CreateInstance()
		{
			return new String_InfoDataTable();
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		internal void InitVars()
		{
			columnStringID = base.Columns["StringID"];
			columnDisplay = base.Columns["Display"];
			columnVisible = base.Columns["Visible"];
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		private void InitClass()
		{
			columnStringID = new DataColumn("StringID", typeof(int), null, MappingType.Element);
			base.Columns.Add(columnStringID);
			columnDisplay = new DataColumn("Display", typeof(string), null, MappingType.Element);
			base.Columns.Add(columnDisplay);
			columnVisible = new DataColumn("Visible", typeof(string), null, MappingType.Element);
			base.Columns.Add(columnVisible);
			base.Constraints.Add(new UniqueConstraint("Constraint1", new DataColumn[1] { columnStringID }, isPrimaryKey: true));
			columnStringID.AllowDBNull = false;
			columnStringID.ReadOnly = true;
			columnStringID.Unique = true;
			columnDisplay.AllowDBNull = false;
			columnVisible.AllowDBNull = false;
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public String_InfoRow NewString_InfoRow()
		{
			return (String_InfoRow)NewRow();
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		protected override DataRow NewRowFromBuilder(DataRowBuilder builder)
		{
			return new String_InfoRow(builder);
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		protected override Type GetRowType()
		{
			return typeof(String_InfoRow);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		protected override void OnRowChanged(DataRowChangeEventArgs e)
		{
			base.OnRowChanged(e);
			if (this.String_InfoRowChanged != null)
			{
				this.String_InfoRowChanged(this, new String_InfoRowChangeEvent((String_InfoRow)e.Row, e.Action));
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		protected override void OnRowChanging(DataRowChangeEventArgs e)
		{
			base.OnRowChanging(e);
			if (this.String_InfoRowChanging != null)
			{
				this.String_InfoRowChanging(this, new String_InfoRowChangeEvent((String_InfoRow)e.Row, e.Action));
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		protected override void OnRowDeleted(DataRowChangeEventArgs e)
		{
			base.OnRowDeleted(e);
			if (this.String_InfoRowDeleted != null)
			{
				this.String_InfoRowDeleted(this, new String_InfoRowChangeEvent((String_InfoRow)e.Row, e.Action));
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		protected override void OnRowDeleting(DataRowChangeEventArgs e)
		{
			base.OnRowDeleting(e);
			if (this.String_InfoRowDeleting != null)
			{
				this.String_InfoRowDeleting(this, new String_InfoRowChangeEvent((String_InfoRow)e.Row, e.Action));
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public void RemoveString_InfoRow(String_InfoRow row)
		{
			base.Rows.Remove(row);
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public static XmlSchemaComplexType GetTypedTableSchema(XmlSchemaSet xs)
		{
			XmlSchemaComplexType xmlSchemaComplexType = new XmlSchemaComplexType();
			XmlSchemaSequence xmlSchemaSequence = new XmlSchemaSequence();
			UIDataSet uIDataSet = new UIDataSet();
			XmlSchemaAny xmlSchemaAny = new XmlSchemaAny();
			xmlSchemaAny.Namespace = "http://www.w3.org/2001/XMLSchema";
			xmlSchemaAny.MinOccurs = 0m;
			xmlSchemaAny.MaxOccurs = decimal.MaxValue;
			xmlSchemaAny.ProcessContents = XmlSchemaContentProcessing.Lax;
			xmlSchemaSequence.Items.Add(xmlSchemaAny);
			XmlSchemaAny xmlSchemaAny2 = new XmlSchemaAny();
			xmlSchemaAny2.Namespace = "urn:schemas-microsoft-com:xml-diffgram-v1";
			xmlSchemaAny2.MinOccurs = 1m;
			xmlSchemaAny2.ProcessContents = XmlSchemaContentProcessing.Lax;
			xmlSchemaSequence.Items.Add(xmlSchemaAny2);
			XmlSchemaAttribute xmlSchemaAttribute = new XmlSchemaAttribute();
			xmlSchemaAttribute.Name = "namespace";
			xmlSchemaAttribute.FixedValue = uIDataSet.Namespace;
			xmlSchemaComplexType.Attributes.Add(xmlSchemaAttribute);
			XmlSchemaAttribute xmlSchemaAttribute2 = new XmlSchemaAttribute();
			xmlSchemaAttribute2.Name = "tableTypeName";
			xmlSchemaAttribute2.FixedValue = "String_InfoDataTable";
			xmlSchemaComplexType.Attributes.Add(xmlSchemaAttribute2);
			xmlSchemaComplexType.Particle = xmlSchemaSequence;
			XmlSchema schemaSerializable = uIDataSet.GetSchemaSerializable();
			if (xs.Contains(schemaSerializable.TargetNamespace))
			{
				MemoryStream memoryStream = new MemoryStream();
				MemoryStream memoryStream2 = new MemoryStream();
				try
				{
					XmlSchema xmlSchema = null;
					schemaSerializable.Write(memoryStream);
					IEnumerator enumerator = xs.Schemas(schemaSerializable.TargetNamespace).GetEnumerator();
					while (enumerator.MoveNext())
					{
						xmlSchema = (XmlSchema)enumerator.Current;
						memoryStream2.SetLength(0L);
						xmlSchema.Write(memoryStream2);
						if (memoryStream.Length == memoryStream2.Length)
						{
							memoryStream.Position = 0L;
							memoryStream2.Position = 0L;
							while (memoryStream.Position != memoryStream.Length && memoryStream.ReadByte() == memoryStream2.ReadByte())
							{
							}
							if (memoryStream.Position == memoryStream.Length)
							{
								return xmlSchemaComplexType;
							}
						}
					}
				}
				finally
				{
					memoryStream?.Close();
					memoryStream2?.Close();
				}
			}
			xs.Add(schemaSerializable);
			return xmlSchemaComplexType;
		}
	}

	[Serializable]
	[XmlSchemaProvider("GetTypedTableSchema")]
	public class Spec_InfoDataTable : DataTable, IEnumerable
	{
		private DataColumn columnSpecID;

		private DataColumn columnType;

		private DataColumn columnDisplay;

		private DataColumn columnVisible;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public DataColumn SpecIDColumn => columnSpecID;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public DataColumn TypeColumn => columnType;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public DataColumn DisplayColumn => columnDisplay;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public DataColumn VisibleColumn => columnVisible;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[Browsable(false)]
		public int Count => base.Rows.Count;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public Spec_InfoRow this[int index] => (Spec_InfoRow)base.Rows[index];

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public event Spec_InfoRowChangeEventHandler Spec_InfoRowChanging;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public event Spec_InfoRowChangeEventHandler Spec_InfoRowChanged;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public event Spec_InfoRowChangeEventHandler Spec_InfoRowDeleting;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public event Spec_InfoRowChangeEventHandler Spec_InfoRowDeleted;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public Spec_InfoDataTable()
		{
			base.TableName = "Spec_Info";
			BeginInit();
			InitClass();
			EndInit();
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		internal Spec_InfoDataTable(DataTable table)
		{
			base.TableName = table.TableName;
			if (table.CaseSensitive != table.DataSet.CaseSensitive)
			{
				base.CaseSensitive = table.CaseSensitive;
			}
			if (table.Locale.ToString() != table.DataSet.Locale.ToString())
			{
				base.Locale = table.Locale;
			}
			if (table.Namespace != table.DataSet.Namespace)
			{
				base.Namespace = table.Namespace;
			}
			base.Prefix = table.Prefix;
			base.MinimumCapacity = table.MinimumCapacity;
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		protected Spec_InfoDataTable(SerializationInfo info, StreamingContext context)
			: base(info, context)
		{
			InitVars();
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public void AddSpec_InfoRow(Spec_InfoRow row)
		{
			base.Rows.Add(row);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public Spec_InfoRow AddSpec_InfoRow(int SpecID, int Type, string Display, string Visible)
		{
			Spec_InfoRow spec_InfoRow = (Spec_InfoRow)NewRow();
			object[] itemArray = new object[4] { SpecID, Type, Display, Visible };
			spec_InfoRow.ItemArray = itemArray;
			base.Rows.Add(spec_InfoRow);
			return spec_InfoRow;
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public Spec_InfoRow FindBySpecID(int SpecID)
		{
			return (Spec_InfoRow)base.Rows.Find(new object[1] { SpecID });
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public virtual IEnumerator GetEnumerator()
		{
			return base.Rows.GetEnumerator();
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public override DataTable Clone()
		{
			Spec_InfoDataTable spec_InfoDataTable = (Spec_InfoDataTable)base.Clone();
			spec_InfoDataTable.InitVars();
			return spec_InfoDataTable;
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		protected override DataTable CreateInstance()
		{
			return new Spec_InfoDataTable();
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		internal void InitVars()
		{
			columnSpecID = base.Columns["SpecID"];
			columnType = base.Columns["Type"];
			columnDisplay = base.Columns["Display"];
			columnVisible = base.Columns["Visible"];
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		private void InitClass()
		{
			columnSpecID = new DataColumn("SpecID", typeof(int), null, MappingType.Element);
			base.Columns.Add(columnSpecID);
			columnType = new DataColumn("Type", typeof(int), null, MappingType.Element);
			base.Columns.Add(columnType);
			columnDisplay = new DataColumn("Display", typeof(string), null, MappingType.Element);
			base.Columns.Add(columnDisplay);
			columnVisible = new DataColumn("Visible", typeof(string), null, MappingType.Element);
			base.Columns.Add(columnVisible);
			base.Constraints.Add(new UniqueConstraint("Constraint1", new DataColumn[1] { columnSpecID }, isPrimaryKey: true));
			columnSpecID.AllowDBNull = false;
			columnSpecID.ReadOnly = true;
			columnSpecID.Unique = true;
			columnType.AllowDBNull = false;
			columnDisplay.AllowDBNull = false;
			columnVisible.AllowDBNull = false;
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public Spec_InfoRow NewSpec_InfoRow()
		{
			return (Spec_InfoRow)NewRow();
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		protected override DataRow NewRowFromBuilder(DataRowBuilder builder)
		{
			return new Spec_InfoRow(builder);
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		protected override Type GetRowType()
		{
			return typeof(Spec_InfoRow);
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		protected override void OnRowChanged(DataRowChangeEventArgs e)
		{
			base.OnRowChanged(e);
			if (this.Spec_InfoRowChanged != null)
			{
				this.Spec_InfoRowChanged(this, new Spec_InfoRowChangeEvent((Spec_InfoRow)e.Row, e.Action));
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		protected override void OnRowChanging(DataRowChangeEventArgs e)
		{
			base.OnRowChanging(e);
			if (this.Spec_InfoRowChanging != null)
			{
				this.Spec_InfoRowChanging(this, new Spec_InfoRowChangeEvent((Spec_InfoRow)e.Row, e.Action));
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		protected override void OnRowDeleted(DataRowChangeEventArgs e)
		{
			base.OnRowDeleted(e);
			if (this.Spec_InfoRowDeleted != null)
			{
				this.Spec_InfoRowDeleted(this, new Spec_InfoRowChangeEvent((Spec_InfoRow)e.Row, e.Action));
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		protected override void OnRowDeleting(DataRowChangeEventArgs e)
		{
			base.OnRowDeleting(e);
			if (this.Spec_InfoRowDeleting != null)
			{
				this.Spec_InfoRowDeleting(this, new Spec_InfoRowChangeEvent((Spec_InfoRow)e.Row, e.Action));
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public void RemoveSpec_InfoRow(Spec_InfoRow row)
		{
			base.Rows.Remove(row);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public static XmlSchemaComplexType GetTypedTableSchema(XmlSchemaSet xs)
		{
			XmlSchemaComplexType xmlSchemaComplexType = new XmlSchemaComplexType();
			XmlSchemaSequence xmlSchemaSequence = new XmlSchemaSequence();
			UIDataSet uIDataSet = new UIDataSet();
			XmlSchemaAny xmlSchemaAny = new XmlSchemaAny();
			xmlSchemaAny.Namespace = "http://www.w3.org/2001/XMLSchema";
			xmlSchemaAny.MinOccurs = 0m;
			xmlSchemaAny.MaxOccurs = decimal.MaxValue;
			xmlSchemaAny.ProcessContents = XmlSchemaContentProcessing.Lax;
			xmlSchemaSequence.Items.Add(xmlSchemaAny);
			XmlSchemaAny xmlSchemaAny2 = new XmlSchemaAny();
			xmlSchemaAny2.Namespace = "urn:schemas-microsoft-com:xml-diffgram-v1";
			xmlSchemaAny2.MinOccurs = 1m;
			xmlSchemaAny2.ProcessContents = XmlSchemaContentProcessing.Lax;
			xmlSchemaSequence.Items.Add(xmlSchemaAny2);
			XmlSchemaAttribute xmlSchemaAttribute = new XmlSchemaAttribute();
			xmlSchemaAttribute.Name = "namespace";
			xmlSchemaAttribute.FixedValue = uIDataSet.Namespace;
			xmlSchemaComplexType.Attributes.Add(xmlSchemaAttribute);
			XmlSchemaAttribute xmlSchemaAttribute2 = new XmlSchemaAttribute();
			xmlSchemaAttribute2.Name = "tableTypeName";
			xmlSchemaAttribute2.FixedValue = "Spec_InfoDataTable";
			xmlSchemaComplexType.Attributes.Add(xmlSchemaAttribute2);
			xmlSchemaComplexType.Particle = xmlSchemaSequence;
			XmlSchema schemaSerializable = uIDataSet.GetSchemaSerializable();
			if (xs.Contains(schemaSerializable.TargetNamespace))
			{
				MemoryStream memoryStream = new MemoryStream();
				MemoryStream memoryStream2 = new MemoryStream();
				try
				{
					XmlSchema xmlSchema = null;
					schemaSerializable.Write(memoryStream);
					IEnumerator enumerator = xs.Schemas(schemaSerializable.TargetNamespace).GetEnumerator();
					while (enumerator.MoveNext())
					{
						xmlSchema = (XmlSchema)enumerator.Current;
						memoryStream2.SetLength(0L);
						xmlSchema.Write(memoryStream2);
						if (memoryStream.Length == memoryStream2.Length)
						{
							memoryStream.Position = 0L;
							memoryStream2.Position = 0L;
							while (memoryStream.Position != memoryStream.Length && memoryStream.ReadByte() == memoryStream2.ReadByte())
							{
							}
							if (memoryStream.Position == memoryStream.Length)
							{
								return xmlSchemaComplexType;
							}
						}
					}
				}
				finally
				{
					memoryStream?.Close();
					memoryStream2?.Close();
				}
			}
			xs.Add(schemaSerializable);
			return xmlSchemaComplexType;
		}
	}

	[Serializable]
	[XmlSchemaProvider("GetTypedTableSchema")]
	public class PLU_DF_UDataTable : DataTable, IEnumerable
	{
		private DataColumn columnValue;

		private DataColumn columnDisplay;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public DataColumn ValueColumn => columnValue;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public DataColumn DisplayColumn => columnDisplay;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[Browsable(false)]
		[DebuggerNonUserCode]
		public int Count => base.Rows.Count;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public PLU_DF_URow this[int index] => (PLU_DF_URow)base.Rows[index];

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public event PLU_DF_URowChangeEventHandler PLU_DF_URowChanging;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public event PLU_DF_URowChangeEventHandler PLU_DF_URowChanged;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public event PLU_DF_URowChangeEventHandler PLU_DF_URowDeleting;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public event PLU_DF_URowChangeEventHandler PLU_DF_URowDeleted;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public PLU_DF_UDataTable()
		{
			base.TableName = "PLU_DF_U";
			BeginInit();
			InitClass();
			EndInit();
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		internal PLU_DF_UDataTable(DataTable table)
		{
			base.TableName = table.TableName;
			if (table.CaseSensitive != table.DataSet.CaseSensitive)
			{
				base.CaseSensitive = table.CaseSensitive;
			}
			if (table.Locale.ToString() != table.DataSet.Locale.ToString())
			{
				base.Locale = table.Locale;
			}
			if (table.Namespace != table.DataSet.Namespace)
			{
				base.Namespace = table.Namespace;
			}
			base.Prefix = table.Prefix;
			base.MinimumCapacity = table.MinimumCapacity;
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		protected PLU_DF_UDataTable(SerializationInfo info, StreamingContext context)
			: base(info, context)
		{
			InitVars();
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public void AddPLU_DF_URow(PLU_DF_URow row)
		{
			base.Rows.Add(row);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public PLU_DF_URow AddPLU_DF_URow(int Value, string Display)
		{
			PLU_DF_URow pLU_DF_URow = (PLU_DF_URow)NewRow();
			object[] itemArray = new object[2] { Value, Display };
			pLU_DF_URow.ItemArray = itemArray;
			base.Rows.Add(pLU_DF_URow);
			return pLU_DF_URow;
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public PLU_DF_URow FindByValue(int Value)
		{
			return (PLU_DF_URow)base.Rows.Find(new object[1] { Value });
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public virtual IEnumerator GetEnumerator()
		{
			return base.Rows.GetEnumerator();
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public override DataTable Clone()
		{
			PLU_DF_UDataTable pLU_DF_UDataTable = (PLU_DF_UDataTable)base.Clone();
			pLU_DF_UDataTable.InitVars();
			return pLU_DF_UDataTable;
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		protected override DataTable CreateInstance()
		{
			return new PLU_DF_UDataTable();
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		internal void InitVars()
		{
			columnValue = base.Columns["Value"];
			columnDisplay = base.Columns["Display"];
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		private void InitClass()
		{
			columnValue = new DataColumn("Value", typeof(int), null, MappingType.Element);
			base.Columns.Add(columnValue);
			columnDisplay = new DataColumn("Display", typeof(string), null, MappingType.Element);
			base.Columns.Add(columnDisplay);
			base.Constraints.Add(new UniqueConstraint("Constraint1", new DataColumn[1] { columnValue }, isPrimaryKey: true));
			columnValue.AllowDBNull = false;
			columnValue.Unique = true;
			columnDisplay.AllowDBNull = false;
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public PLU_DF_URow NewPLU_DF_URow()
		{
			return (PLU_DF_URow)NewRow();
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		protected override DataRow NewRowFromBuilder(DataRowBuilder builder)
		{
			return new PLU_DF_URow(builder);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		protected override Type GetRowType()
		{
			return typeof(PLU_DF_URow);
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		protected override void OnRowChanged(DataRowChangeEventArgs e)
		{
			base.OnRowChanged(e);
			if (this.PLU_DF_URowChanged != null)
			{
				this.PLU_DF_URowChanged(this, new PLU_DF_URowChangeEvent((PLU_DF_URow)e.Row, e.Action));
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		protected override void OnRowChanging(DataRowChangeEventArgs e)
		{
			base.OnRowChanging(e);
			if (this.PLU_DF_URowChanging != null)
			{
				this.PLU_DF_URowChanging(this, new PLU_DF_URowChangeEvent((PLU_DF_URow)e.Row, e.Action));
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		protected override void OnRowDeleted(DataRowChangeEventArgs e)
		{
			base.OnRowDeleted(e);
			if (this.PLU_DF_URowDeleted != null)
			{
				this.PLU_DF_URowDeleted(this, new PLU_DF_URowChangeEvent((PLU_DF_URow)e.Row, e.Action));
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		protected override void OnRowDeleting(DataRowChangeEventArgs e)
		{
			base.OnRowDeleting(e);
			if (this.PLU_DF_URowDeleting != null)
			{
				this.PLU_DF_URowDeleting(this, new PLU_DF_URowChangeEvent((PLU_DF_URow)e.Row, e.Action));
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public void RemovePLU_DF_URow(PLU_DF_URow row)
		{
			base.Rows.Remove(row);
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public static XmlSchemaComplexType GetTypedTableSchema(XmlSchemaSet xs)
		{
			XmlSchemaComplexType xmlSchemaComplexType = new XmlSchemaComplexType();
			XmlSchemaSequence xmlSchemaSequence = new XmlSchemaSequence();
			UIDataSet uIDataSet = new UIDataSet();
			XmlSchemaAny xmlSchemaAny = new XmlSchemaAny();
			xmlSchemaAny.Namespace = "http://www.w3.org/2001/XMLSchema";
			xmlSchemaAny.MinOccurs = 0m;
			xmlSchemaAny.MaxOccurs = decimal.MaxValue;
			xmlSchemaAny.ProcessContents = XmlSchemaContentProcessing.Lax;
			xmlSchemaSequence.Items.Add(xmlSchemaAny);
			XmlSchemaAny xmlSchemaAny2 = new XmlSchemaAny();
			xmlSchemaAny2.Namespace = "urn:schemas-microsoft-com:xml-diffgram-v1";
			xmlSchemaAny2.MinOccurs = 1m;
			xmlSchemaAny2.ProcessContents = XmlSchemaContentProcessing.Lax;
			xmlSchemaSequence.Items.Add(xmlSchemaAny2);
			XmlSchemaAttribute xmlSchemaAttribute = new XmlSchemaAttribute();
			xmlSchemaAttribute.Name = "namespace";
			xmlSchemaAttribute.FixedValue = uIDataSet.Namespace;
			xmlSchemaComplexType.Attributes.Add(xmlSchemaAttribute);
			XmlSchemaAttribute xmlSchemaAttribute2 = new XmlSchemaAttribute();
			xmlSchemaAttribute2.Name = "tableTypeName";
			xmlSchemaAttribute2.FixedValue = "PLU_DF_UDataTable";
			xmlSchemaComplexType.Attributes.Add(xmlSchemaAttribute2);
			xmlSchemaComplexType.Particle = xmlSchemaSequence;
			XmlSchema schemaSerializable = uIDataSet.GetSchemaSerializable();
			if (xs.Contains(schemaSerializable.TargetNamespace))
			{
				MemoryStream memoryStream = new MemoryStream();
				MemoryStream memoryStream2 = new MemoryStream();
				try
				{
					XmlSchema xmlSchema = null;
					schemaSerializable.Write(memoryStream);
					IEnumerator enumerator = xs.Schemas(schemaSerializable.TargetNamespace).GetEnumerator();
					while (enumerator.MoveNext())
					{
						xmlSchema = (XmlSchema)enumerator.Current;
						memoryStream2.SetLength(0L);
						xmlSchema.Write(memoryStream2);
						if (memoryStream.Length == memoryStream2.Length)
						{
							memoryStream.Position = 0L;
							memoryStream2.Position = 0L;
							while (memoryStream.Position != memoryStream.Length && memoryStream.ReadByte() == memoryStream2.ReadByte())
							{
							}
							if (memoryStream.Position == memoryStream.Length)
							{
								return xmlSchemaComplexType;
							}
						}
					}
				}
				finally
				{
					memoryStream?.Close();
					memoryStream2?.Close();
				}
			}
			xs.Add(schemaSerializable);
			return xmlSchemaComplexType;
		}
	}

	[Serializable]
	[XmlSchemaProvider("GetTypedTableSchema")]
	public class PLU_DF_DDataTable : DataTable, IEnumerable
	{
		private DataColumn columnValue;

		private DataColumn columnDisplay;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public DataColumn ValueColumn => columnValue;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public DataColumn DisplayColumn => columnDisplay;

		[Browsable(false)]
		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public int Count => base.Rows.Count;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public PLU_DF_DRow this[int index] => (PLU_DF_DRow)base.Rows[index];

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public event PLU_DF_DRowChangeEventHandler PLU_DF_DRowChanging;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public event PLU_DF_DRowChangeEventHandler PLU_DF_DRowChanged;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public event PLU_DF_DRowChangeEventHandler PLU_DF_DRowDeleting;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public event PLU_DF_DRowChangeEventHandler PLU_DF_DRowDeleted;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public PLU_DF_DDataTable()
		{
			base.TableName = "PLU_DF_D";
			BeginInit();
			InitClass();
			EndInit();
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		internal PLU_DF_DDataTable(DataTable table)
		{
			base.TableName = table.TableName;
			if (table.CaseSensitive != table.DataSet.CaseSensitive)
			{
				base.CaseSensitive = table.CaseSensitive;
			}
			if (table.Locale.ToString() != table.DataSet.Locale.ToString())
			{
				base.Locale = table.Locale;
			}
			if (table.Namespace != table.DataSet.Namespace)
			{
				base.Namespace = table.Namespace;
			}
			base.Prefix = table.Prefix;
			base.MinimumCapacity = table.MinimumCapacity;
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		protected PLU_DF_DDataTable(SerializationInfo info, StreamingContext context)
			: base(info, context)
		{
			InitVars();
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public void AddPLU_DF_DRow(PLU_DF_DRow row)
		{
			base.Rows.Add(row);
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public PLU_DF_DRow AddPLU_DF_DRow(int Value, string Display)
		{
			PLU_DF_DRow pLU_DF_DRow = (PLU_DF_DRow)NewRow();
			object[] itemArray = new object[2] { Value, Display };
			pLU_DF_DRow.ItemArray = itemArray;
			base.Rows.Add(pLU_DF_DRow);
			return pLU_DF_DRow;
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public PLU_DF_DRow FindByValue(int Value)
		{
			return (PLU_DF_DRow)base.Rows.Find(new object[1] { Value });
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public virtual IEnumerator GetEnumerator()
		{
			return base.Rows.GetEnumerator();
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public override DataTable Clone()
		{
			PLU_DF_DDataTable pLU_DF_DDataTable = (PLU_DF_DDataTable)base.Clone();
			pLU_DF_DDataTable.InitVars();
			return pLU_DF_DDataTable;
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		protected override DataTable CreateInstance()
		{
			return new PLU_DF_DDataTable();
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		internal void InitVars()
		{
			columnValue = base.Columns["Value"];
			columnDisplay = base.Columns["Display"];
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		private void InitClass()
		{
			columnValue = new DataColumn("Value", typeof(int), null, MappingType.Element);
			base.Columns.Add(columnValue);
			columnDisplay = new DataColumn("Display", typeof(string), null, MappingType.Element);
			base.Columns.Add(columnDisplay);
			base.Constraints.Add(new UniqueConstraint("Constraint1", new DataColumn[1] { columnValue }, isPrimaryKey: true));
			columnValue.AllowDBNull = false;
			columnValue.Unique = true;
			columnDisplay.AllowDBNull = false;
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public PLU_DF_DRow NewPLU_DF_DRow()
		{
			return (PLU_DF_DRow)NewRow();
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		protected override DataRow NewRowFromBuilder(DataRowBuilder builder)
		{
			return new PLU_DF_DRow(builder);
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		protected override Type GetRowType()
		{
			return typeof(PLU_DF_DRow);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		protected override void OnRowChanged(DataRowChangeEventArgs e)
		{
			base.OnRowChanged(e);
			if (this.PLU_DF_DRowChanged != null)
			{
				this.PLU_DF_DRowChanged(this, new PLU_DF_DRowChangeEvent((PLU_DF_DRow)e.Row, e.Action));
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		protected override void OnRowChanging(DataRowChangeEventArgs e)
		{
			base.OnRowChanging(e);
			if (this.PLU_DF_DRowChanging != null)
			{
				this.PLU_DF_DRowChanging(this, new PLU_DF_DRowChangeEvent((PLU_DF_DRow)e.Row, e.Action));
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		protected override void OnRowDeleted(DataRowChangeEventArgs e)
		{
			base.OnRowDeleted(e);
			if (this.PLU_DF_DRowDeleted != null)
			{
				this.PLU_DF_DRowDeleted(this, new PLU_DF_DRowChangeEvent((PLU_DF_DRow)e.Row, e.Action));
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		protected override void OnRowDeleting(DataRowChangeEventArgs e)
		{
			base.OnRowDeleting(e);
			if (this.PLU_DF_DRowDeleting != null)
			{
				this.PLU_DF_DRowDeleting(this, new PLU_DF_DRowChangeEvent((PLU_DF_DRow)e.Row, e.Action));
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public void RemovePLU_DF_DRow(PLU_DF_DRow row)
		{
			base.Rows.Remove(row);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public static XmlSchemaComplexType GetTypedTableSchema(XmlSchemaSet xs)
		{
			XmlSchemaComplexType xmlSchemaComplexType = new XmlSchemaComplexType();
			XmlSchemaSequence xmlSchemaSequence = new XmlSchemaSequence();
			UIDataSet uIDataSet = new UIDataSet();
			XmlSchemaAny xmlSchemaAny = new XmlSchemaAny();
			xmlSchemaAny.Namespace = "http://www.w3.org/2001/XMLSchema";
			xmlSchemaAny.MinOccurs = 0m;
			xmlSchemaAny.MaxOccurs = decimal.MaxValue;
			xmlSchemaAny.ProcessContents = XmlSchemaContentProcessing.Lax;
			xmlSchemaSequence.Items.Add(xmlSchemaAny);
			XmlSchemaAny xmlSchemaAny2 = new XmlSchemaAny();
			xmlSchemaAny2.Namespace = "urn:schemas-microsoft-com:xml-diffgram-v1";
			xmlSchemaAny2.MinOccurs = 1m;
			xmlSchemaAny2.ProcessContents = XmlSchemaContentProcessing.Lax;
			xmlSchemaSequence.Items.Add(xmlSchemaAny2);
			XmlSchemaAttribute xmlSchemaAttribute = new XmlSchemaAttribute();
			xmlSchemaAttribute.Name = "namespace";
			xmlSchemaAttribute.FixedValue = uIDataSet.Namespace;
			xmlSchemaComplexType.Attributes.Add(xmlSchemaAttribute);
			XmlSchemaAttribute xmlSchemaAttribute2 = new XmlSchemaAttribute();
			xmlSchemaAttribute2.Name = "tableTypeName";
			xmlSchemaAttribute2.FixedValue = "PLU_DF_DDataTable";
			xmlSchemaComplexType.Attributes.Add(xmlSchemaAttribute2);
			xmlSchemaComplexType.Particle = xmlSchemaSequence;
			XmlSchema schemaSerializable = uIDataSet.GetSchemaSerializable();
			if (xs.Contains(schemaSerializable.TargetNamespace))
			{
				MemoryStream memoryStream = new MemoryStream();
				MemoryStream memoryStream2 = new MemoryStream();
				try
				{
					XmlSchema xmlSchema = null;
					schemaSerializable.Write(memoryStream);
					IEnumerator enumerator = xs.Schemas(schemaSerializable.TargetNamespace).GetEnumerator();
					while (enumerator.MoveNext())
					{
						xmlSchema = (XmlSchema)enumerator.Current;
						memoryStream2.SetLength(0L);
						xmlSchema.Write(memoryStream2);
						if (memoryStream.Length == memoryStream2.Length)
						{
							memoryStream.Position = 0L;
							memoryStream2.Position = 0L;
							while (memoryStream.Position != memoryStream.Length && memoryStream.ReadByte() == memoryStream2.ReadByte())
							{
							}
							if (memoryStream.Position == memoryStream.Length)
							{
								return xmlSchemaComplexType;
							}
						}
					}
				}
				finally
				{
					memoryStream?.Close();
					memoryStream2?.Close();
				}
			}
			xs.Add(schemaSerializable);
			return xmlSchemaComplexType;
		}
	}

	[Serializable]
	[XmlSchemaProvider("GetTypedTableSchema")]
	public class PLU_DA_SortDataTable : DataTable, IEnumerable
	{
		private DataColumn columnValue;

		private DataColumn columnDisplay;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public DataColumn ValueColumn => columnValue;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public DataColumn DisplayColumn => columnDisplay;

		[Browsable(false)]
		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public int Count => base.Rows.Count;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public PLU_DA_SortRow this[int index] => (PLU_DA_SortRow)base.Rows[index];

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public event PLU_DA_SortRowChangeEventHandler PLU_DA_SortRowChanging;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public event PLU_DA_SortRowChangeEventHandler PLU_DA_SortRowChanged;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public event PLU_DA_SortRowChangeEventHandler PLU_DA_SortRowDeleting;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public event PLU_DA_SortRowChangeEventHandler PLU_DA_SortRowDeleted;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public PLU_DA_SortDataTable()
		{
			base.TableName = "PLU_DA_Sort";
			BeginInit();
			InitClass();
			EndInit();
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		internal PLU_DA_SortDataTable(DataTable table)
		{
			base.TableName = table.TableName;
			if (table.CaseSensitive != table.DataSet.CaseSensitive)
			{
				base.CaseSensitive = table.CaseSensitive;
			}
			if (table.Locale.ToString() != table.DataSet.Locale.ToString())
			{
				base.Locale = table.Locale;
			}
			if (table.Namespace != table.DataSet.Namespace)
			{
				base.Namespace = table.Namespace;
			}
			base.Prefix = table.Prefix;
			base.MinimumCapacity = table.MinimumCapacity;
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		protected PLU_DA_SortDataTable(SerializationInfo info, StreamingContext context)
			: base(info, context)
		{
			InitVars();
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public void AddPLU_DA_SortRow(PLU_DA_SortRow row)
		{
			base.Rows.Add(row);
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public PLU_DA_SortRow AddPLU_DA_SortRow(int Value, string Display)
		{
			PLU_DA_SortRow pLU_DA_SortRow = (PLU_DA_SortRow)NewRow();
			object[] itemArray = new object[2] { Value, Display };
			pLU_DA_SortRow.ItemArray = itemArray;
			base.Rows.Add(pLU_DA_SortRow);
			return pLU_DA_SortRow;
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public PLU_DA_SortRow FindByValue(int Value)
		{
			return (PLU_DA_SortRow)base.Rows.Find(new object[1] { Value });
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public virtual IEnumerator GetEnumerator()
		{
			return base.Rows.GetEnumerator();
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public override DataTable Clone()
		{
			PLU_DA_SortDataTable pLU_DA_SortDataTable = (PLU_DA_SortDataTable)base.Clone();
			pLU_DA_SortDataTable.InitVars();
			return pLU_DA_SortDataTable;
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		protected override DataTable CreateInstance()
		{
			return new PLU_DA_SortDataTable();
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		internal void InitVars()
		{
			columnValue = base.Columns["Value"];
			columnDisplay = base.Columns["Display"];
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		private void InitClass()
		{
			columnValue = new DataColumn("Value", typeof(int), null, MappingType.Element);
			base.Columns.Add(columnValue);
			columnDisplay = new DataColumn("Display", typeof(string), null, MappingType.Element);
			base.Columns.Add(columnDisplay);
			base.Constraints.Add(new UniqueConstraint("Constraint1", new DataColumn[1] { columnValue }, isPrimaryKey: true));
			columnValue.AllowDBNull = false;
			columnValue.Unique = true;
			columnDisplay.AllowDBNull = false;
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public PLU_DA_SortRow NewPLU_DA_SortRow()
		{
			return (PLU_DA_SortRow)NewRow();
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		protected override DataRow NewRowFromBuilder(DataRowBuilder builder)
		{
			return new PLU_DA_SortRow(builder);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		protected override Type GetRowType()
		{
			return typeof(PLU_DA_SortRow);
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		protected override void OnRowChanged(DataRowChangeEventArgs e)
		{
			base.OnRowChanged(e);
			if (this.PLU_DA_SortRowChanged != null)
			{
				this.PLU_DA_SortRowChanged(this, new PLU_DA_SortRowChangeEvent((PLU_DA_SortRow)e.Row, e.Action));
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		protected override void OnRowChanging(DataRowChangeEventArgs e)
		{
			base.OnRowChanging(e);
			if (this.PLU_DA_SortRowChanging != null)
			{
				this.PLU_DA_SortRowChanging(this, new PLU_DA_SortRowChangeEvent((PLU_DA_SortRow)e.Row, e.Action));
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		protected override void OnRowDeleted(DataRowChangeEventArgs e)
		{
			base.OnRowDeleted(e);
			if (this.PLU_DA_SortRowDeleted != null)
			{
				this.PLU_DA_SortRowDeleted(this, new PLU_DA_SortRowChangeEvent((PLU_DA_SortRow)e.Row, e.Action));
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		protected override void OnRowDeleting(DataRowChangeEventArgs e)
		{
			base.OnRowDeleting(e);
			if (this.PLU_DA_SortRowDeleting != null)
			{
				this.PLU_DA_SortRowDeleting(this, new PLU_DA_SortRowChangeEvent((PLU_DA_SortRow)e.Row, e.Action));
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public void RemovePLU_DA_SortRow(PLU_DA_SortRow row)
		{
			base.Rows.Remove(row);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public static XmlSchemaComplexType GetTypedTableSchema(XmlSchemaSet xs)
		{
			XmlSchemaComplexType xmlSchemaComplexType = new XmlSchemaComplexType();
			XmlSchemaSequence xmlSchemaSequence = new XmlSchemaSequence();
			UIDataSet uIDataSet = new UIDataSet();
			XmlSchemaAny xmlSchemaAny = new XmlSchemaAny();
			xmlSchemaAny.Namespace = "http://www.w3.org/2001/XMLSchema";
			xmlSchemaAny.MinOccurs = 0m;
			xmlSchemaAny.MaxOccurs = decimal.MaxValue;
			xmlSchemaAny.ProcessContents = XmlSchemaContentProcessing.Lax;
			xmlSchemaSequence.Items.Add(xmlSchemaAny);
			XmlSchemaAny xmlSchemaAny2 = new XmlSchemaAny();
			xmlSchemaAny2.Namespace = "urn:schemas-microsoft-com:xml-diffgram-v1";
			xmlSchemaAny2.MinOccurs = 1m;
			xmlSchemaAny2.ProcessContents = XmlSchemaContentProcessing.Lax;
			xmlSchemaSequence.Items.Add(xmlSchemaAny2);
			XmlSchemaAttribute xmlSchemaAttribute = new XmlSchemaAttribute();
			xmlSchemaAttribute.Name = "namespace";
			xmlSchemaAttribute.FixedValue = uIDataSet.Namespace;
			xmlSchemaComplexType.Attributes.Add(xmlSchemaAttribute);
			XmlSchemaAttribute xmlSchemaAttribute2 = new XmlSchemaAttribute();
			xmlSchemaAttribute2.Name = "tableTypeName";
			xmlSchemaAttribute2.FixedValue = "PLU_DA_SortDataTable";
			xmlSchemaComplexType.Attributes.Add(xmlSchemaAttribute2);
			xmlSchemaComplexType.Particle = xmlSchemaSequence;
			XmlSchema schemaSerializable = uIDataSet.GetSchemaSerializable();
			if (xs.Contains(schemaSerializable.TargetNamespace))
			{
				MemoryStream memoryStream = new MemoryStream();
				MemoryStream memoryStream2 = new MemoryStream();
				try
				{
					XmlSchema xmlSchema = null;
					schemaSerializable.Write(memoryStream);
					IEnumerator enumerator = xs.Schemas(schemaSerializable.TargetNamespace).GetEnumerator();
					while (enumerator.MoveNext())
					{
						xmlSchema = (XmlSchema)enumerator.Current;
						memoryStream2.SetLength(0L);
						xmlSchema.Write(memoryStream2);
						if (memoryStream.Length == memoryStream2.Length)
						{
							memoryStream.Position = 0L;
							memoryStream2.Position = 0L;
							while (memoryStream.Position != memoryStream.Length && memoryStream.ReadByte() == memoryStream2.ReadByte())
							{
							}
							if (memoryStream.Position == memoryStream.Length)
							{
								return xmlSchemaComplexType;
							}
						}
					}
				}
				finally
				{
					memoryStream?.Close();
					memoryStream2?.Close();
				}
			}
			xs.Add(schemaSerializable);
			return xmlSchemaComplexType;
		}
	}

	[Serializable]
	[XmlSchemaProvider("GetTypedTableSchema")]
	public class LabelItem_Flag1DataTable : DataTable, IEnumerable
	{
		private DataColumn columnFlag1;

		private DataColumn columnDisplay;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public DataColumn Flag1Column => columnFlag1;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public DataColumn DisplayColumn => columnDisplay;

		[DebuggerNonUserCode]
		[Browsable(false)]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public int Count => base.Rows.Count;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public LabelItem_Flag1Row this[int index] => (LabelItem_Flag1Row)base.Rows[index];

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public event LabelItem_Flag1RowChangeEventHandler LabelItem_Flag1RowChanging;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public event LabelItem_Flag1RowChangeEventHandler LabelItem_Flag1RowChanged;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public event LabelItem_Flag1RowChangeEventHandler LabelItem_Flag1RowDeleting;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public event LabelItem_Flag1RowChangeEventHandler LabelItem_Flag1RowDeleted;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public LabelItem_Flag1DataTable()
		{
			base.TableName = "LabelItem_Flag1";
			BeginInit();
			InitClass();
			EndInit();
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		internal LabelItem_Flag1DataTable(DataTable table)
		{
			base.TableName = table.TableName;
			if (table.CaseSensitive != table.DataSet.CaseSensitive)
			{
				base.CaseSensitive = table.CaseSensitive;
			}
			if (table.Locale.ToString() != table.DataSet.Locale.ToString())
			{
				base.Locale = table.Locale;
			}
			if (table.Namespace != table.DataSet.Namespace)
			{
				base.Namespace = table.Namespace;
			}
			base.Prefix = table.Prefix;
			base.MinimumCapacity = table.MinimumCapacity;
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		protected LabelItem_Flag1DataTable(SerializationInfo info, StreamingContext context)
			: base(info, context)
		{
			InitVars();
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public void AddLabelItem_Flag1Row(LabelItem_Flag1Row row)
		{
			base.Rows.Add(row);
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public LabelItem_Flag1Row AddLabelItem_Flag1Row(int Flag1, string Display)
		{
			LabelItem_Flag1Row labelItem_Flag1Row = (LabelItem_Flag1Row)NewRow();
			object[] itemArray = new object[2] { Flag1, Display };
			labelItem_Flag1Row.ItemArray = itemArray;
			base.Rows.Add(labelItem_Flag1Row);
			return labelItem_Flag1Row;
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public LabelItem_Flag1Row FindByFlag1(int Flag1)
		{
			return (LabelItem_Flag1Row)base.Rows.Find(new object[1] { Flag1 });
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public virtual IEnumerator GetEnumerator()
		{
			return base.Rows.GetEnumerator();
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public override DataTable Clone()
		{
			LabelItem_Flag1DataTable labelItem_Flag1DataTable = (LabelItem_Flag1DataTable)base.Clone();
			labelItem_Flag1DataTable.InitVars();
			return labelItem_Flag1DataTable;
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		protected override DataTable CreateInstance()
		{
			return new LabelItem_Flag1DataTable();
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		internal void InitVars()
		{
			columnFlag1 = base.Columns["Flag1"];
			columnDisplay = base.Columns["Display"];
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		private void InitClass()
		{
			columnFlag1 = new DataColumn("Flag1", typeof(int), null, MappingType.Element);
			base.Columns.Add(columnFlag1);
			columnDisplay = new DataColumn("Display", typeof(string), null, MappingType.Element);
			base.Columns.Add(columnDisplay);
			base.Constraints.Add(new UniqueConstraint("Constraint1", new DataColumn[1] { columnFlag1 }, isPrimaryKey: true));
			columnFlag1.AllowDBNull = false;
			columnFlag1.Unique = true;
			columnDisplay.AllowDBNull = false;
			columnDisplay.DefaultValue = "";
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public LabelItem_Flag1Row NewLabelItem_Flag1Row()
		{
			return (LabelItem_Flag1Row)NewRow();
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		protected override DataRow NewRowFromBuilder(DataRowBuilder builder)
		{
			return new LabelItem_Flag1Row(builder);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		protected override Type GetRowType()
		{
			return typeof(LabelItem_Flag1Row);
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		protected override void OnRowChanged(DataRowChangeEventArgs e)
		{
			base.OnRowChanged(e);
			if (this.LabelItem_Flag1RowChanged != null)
			{
				this.LabelItem_Flag1RowChanged(this, new LabelItem_Flag1RowChangeEvent((LabelItem_Flag1Row)e.Row, e.Action));
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		protected override void OnRowChanging(DataRowChangeEventArgs e)
		{
			base.OnRowChanging(e);
			if (this.LabelItem_Flag1RowChanging != null)
			{
				this.LabelItem_Flag1RowChanging(this, new LabelItem_Flag1RowChangeEvent((LabelItem_Flag1Row)e.Row, e.Action));
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		protected override void OnRowDeleted(DataRowChangeEventArgs e)
		{
			base.OnRowDeleted(e);
			if (this.LabelItem_Flag1RowDeleted != null)
			{
				this.LabelItem_Flag1RowDeleted(this, new LabelItem_Flag1RowChangeEvent((LabelItem_Flag1Row)e.Row, e.Action));
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		protected override void OnRowDeleting(DataRowChangeEventArgs e)
		{
			base.OnRowDeleting(e);
			if (this.LabelItem_Flag1RowDeleting != null)
			{
				this.LabelItem_Flag1RowDeleting(this, new LabelItem_Flag1RowChangeEvent((LabelItem_Flag1Row)e.Row, e.Action));
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public void RemoveLabelItem_Flag1Row(LabelItem_Flag1Row row)
		{
			base.Rows.Remove(row);
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public static XmlSchemaComplexType GetTypedTableSchema(XmlSchemaSet xs)
		{
			XmlSchemaComplexType xmlSchemaComplexType = new XmlSchemaComplexType();
			XmlSchemaSequence xmlSchemaSequence = new XmlSchemaSequence();
			UIDataSet uIDataSet = new UIDataSet();
			XmlSchemaAny xmlSchemaAny = new XmlSchemaAny();
			xmlSchemaAny.Namespace = "http://www.w3.org/2001/XMLSchema";
			xmlSchemaAny.MinOccurs = 0m;
			xmlSchemaAny.MaxOccurs = decimal.MaxValue;
			xmlSchemaAny.ProcessContents = XmlSchemaContentProcessing.Lax;
			xmlSchemaSequence.Items.Add(xmlSchemaAny);
			XmlSchemaAny xmlSchemaAny2 = new XmlSchemaAny();
			xmlSchemaAny2.Namespace = "urn:schemas-microsoft-com:xml-diffgram-v1";
			xmlSchemaAny2.MinOccurs = 1m;
			xmlSchemaAny2.ProcessContents = XmlSchemaContentProcessing.Lax;
			xmlSchemaSequence.Items.Add(xmlSchemaAny2);
			XmlSchemaAttribute xmlSchemaAttribute = new XmlSchemaAttribute();
			xmlSchemaAttribute.Name = "namespace";
			xmlSchemaAttribute.FixedValue = uIDataSet.Namespace;
			xmlSchemaComplexType.Attributes.Add(xmlSchemaAttribute);
			XmlSchemaAttribute xmlSchemaAttribute2 = new XmlSchemaAttribute();
			xmlSchemaAttribute2.Name = "tableTypeName";
			xmlSchemaAttribute2.FixedValue = "LabelItem_Flag1DataTable";
			xmlSchemaComplexType.Attributes.Add(xmlSchemaAttribute2);
			xmlSchemaComplexType.Particle = xmlSchemaSequence;
			XmlSchema schemaSerializable = uIDataSet.GetSchemaSerializable();
			if (xs.Contains(schemaSerializable.TargetNamespace))
			{
				MemoryStream memoryStream = new MemoryStream();
				MemoryStream memoryStream2 = new MemoryStream();
				try
				{
					XmlSchema xmlSchema = null;
					schemaSerializable.Write(memoryStream);
					IEnumerator enumerator = xs.Schemas(schemaSerializable.TargetNamespace).GetEnumerator();
					while (enumerator.MoveNext())
					{
						xmlSchema = (XmlSchema)enumerator.Current;
						memoryStream2.SetLength(0L);
						xmlSchema.Write(memoryStream2);
						if (memoryStream.Length == memoryStream2.Length)
						{
							memoryStream.Position = 0L;
							memoryStream2.Position = 0L;
							while (memoryStream.Position != memoryStream.Length && memoryStream.ReadByte() == memoryStream2.ReadByte())
							{
							}
							if (memoryStream.Position == memoryStream.Length)
							{
								return xmlSchemaComplexType;
							}
						}
					}
				}
				finally
				{
					memoryStream?.Close();
					memoryStream2?.Close();
				}
			}
			xs.Add(schemaSerializable);
			return xmlSchemaComplexType;
		}
	}

	[Serializable]
	[XmlSchemaProvider("GetTypedTableSchema")]
	public class LabelItem_Flag2DataTable : DataTable, IEnumerable
	{
		private DataColumn columnFlag1;

		private DataColumn columnFlag2;

		private DataColumn columnDisplay;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public DataColumn Flag1Column => columnFlag1;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public DataColumn Flag2Column => columnFlag2;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public DataColumn DisplayColumn => columnDisplay;

		[Browsable(false)]
		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public int Count => base.Rows.Count;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public LabelItem_Flag2Row this[int index] => (LabelItem_Flag2Row)base.Rows[index];

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public event LabelItem_Flag2RowChangeEventHandler LabelItem_Flag2RowChanging;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public event LabelItem_Flag2RowChangeEventHandler LabelItem_Flag2RowChanged;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public event LabelItem_Flag2RowChangeEventHandler LabelItem_Flag2RowDeleting;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public event LabelItem_Flag2RowChangeEventHandler LabelItem_Flag2RowDeleted;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public LabelItem_Flag2DataTable()
		{
			base.TableName = "LabelItem_Flag2";
			BeginInit();
			InitClass();
			EndInit();
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		internal LabelItem_Flag2DataTable(DataTable table)
		{
			base.TableName = table.TableName;
			if (table.CaseSensitive != table.DataSet.CaseSensitive)
			{
				base.CaseSensitive = table.CaseSensitive;
			}
			if (table.Locale.ToString() != table.DataSet.Locale.ToString())
			{
				base.Locale = table.Locale;
			}
			if (table.Namespace != table.DataSet.Namespace)
			{
				base.Namespace = table.Namespace;
			}
			base.Prefix = table.Prefix;
			base.MinimumCapacity = table.MinimumCapacity;
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		protected LabelItem_Flag2DataTable(SerializationInfo info, StreamingContext context)
			: base(info, context)
		{
			InitVars();
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public void AddLabelItem_Flag2Row(LabelItem_Flag2Row row)
		{
			base.Rows.Add(row);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public LabelItem_Flag2Row AddLabelItem_Flag2Row(LabelItem_Flag1Row parentLabelItem_Flag1RowByLabelItem_Flag1_LabelItem_Flag2, int Flag2, string Display)
		{
			LabelItem_Flag2Row labelItem_Flag2Row = (LabelItem_Flag2Row)NewRow();
			object[] array = new object[3] { null, Flag2, Display };
			if (parentLabelItem_Flag1RowByLabelItem_Flag1_LabelItem_Flag2 != null)
			{
				array[0] = parentLabelItem_Flag1RowByLabelItem_Flag1_LabelItem_Flag2[0];
			}
			labelItem_Flag2Row.ItemArray = array;
			base.Rows.Add(labelItem_Flag2Row);
			return labelItem_Flag2Row;
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public LabelItem_Flag2Row FindByFlag1Flag2(int Flag1, int Flag2)
		{
			return (LabelItem_Flag2Row)base.Rows.Find(new object[2] { Flag1, Flag2 });
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public virtual IEnumerator GetEnumerator()
		{
			return base.Rows.GetEnumerator();
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public override DataTable Clone()
		{
			LabelItem_Flag2DataTable labelItem_Flag2DataTable = (LabelItem_Flag2DataTable)base.Clone();
			labelItem_Flag2DataTable.InitVars();
			return labelItem_Flag2DataTable;
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		protected override DataTable CreateInstance()
		{
			return new LabelItem_Flag2DataTable();
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		internal void InitVars()
		{
			columnFlag1 = base.Columns["Flag1"];
			columnFlag2 = base.Columns["Flag2"];
			columnDisplay = base.Columns["Display"];
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		private void InitClass()
		{
			columnFlag1 = new DataColumn("Flag1", typeof(int), null, MappingType.Element);
			base.Columns.Add(columnFlag1);
			columnFlag2 = new DataColumn("Flag2", typeof(int), null, MappingType.Element);
			base.Columns.Add(columnFlag2);
			columnDisplay = new DataColumn("Display", typeof(string), null, MappingType.Element);
			base.Columns.Add(columnDisplay);
			base.Constraints.Add(new UniqueConstraint("Constraint1", new DataColumn[2] { columnFlag1, columnFlag2 }, isPrimaryKey: true));
			columnFlag1.AllowDBNull = false;
			columnFlag2.AllowDBNull = false;
			columnDisplay.AllowDBNull = false;
			columnDisplay.DefaultValue = "";
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public LabelItem_Flag2Row NewLabelItem_Flag2Row()
		{
			return (LabelItem_Flag2Row)NewRow();
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		protected override DataRow NewRowFromBuilder(DataRowBuilder builder)
		{
			return new LabelItem_Flag2Row(builder);
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		protected override Type GetRowType()
		{
			return typeof(LabelItem_Flag2Row);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		protected override void OnRowChanged(DataRowChangeEventArgs e)
		{
			base.OnRowChanged(e);
			if (this.LabelItem_Flag2RowChanged != null)
			{
				this.LabelItem_Flag2RowChanged(this, new LabelItem_Flag2RowChangeEvent((LabelItem_Flag2Row)e.Row, e.Action));
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		protected override void OnRowChanging(DataRowChangeEventArgs e)
		{
			base.OnRowChanging(e);
			if (this.LabelItem_Flag2RowChanging != null)
			{
				this.LabelItem_Flag2RowChanging(this, new LabelItem_Flag2RowChangeEvent((LabelItem_Flag2Row)e.Row, e.Action));
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		protected override void OnRowDeleted(DataRowChangeEventArgs e)
		{
			base.OnRowDeleted(e);
			if (this.LabelItem_Flag2RowDeleted != null)
			{
				this.LabelItem_Flag2RowDeleted(this, new LabelItem_Flag2RowChangeEvent((LabelItem_Flag2Row)e.Row, e.Action));
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		protected override void OnRowDeleting(DataRowChangeEventArgs e)
		{
			base.OnRowDeleting(e);
			if (this.LabelItem_Flag2RowDeleting != null)
			{
				this.LabelItem_Flag2RowDeleting(this, new LabelItem_Flag2RowChangeEvent((LabelItem_Flag2Row)e.Row, e.Action));
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public void RemoveLabelItem_Flag2Row(LabelItem_Flag2Row row)
		{
			base.Rows.Remove(row);
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public static XmlSchemaComplexType GetTypedTableSchema(XmlSchemaSet xs)
		{
			XmlSchemaComplexType xmlSchemaComplexType = new XmlSchemaComplexType();
			XmlSchemaSequence xmlSchemaSequence = new XmlSchemaSequence();
			UIDataSet uIDataSet = new UIDataSet();
			XmlSchemaAny xmlSchemaAny = new XmlSchemaAny();
			xmlSchemaAny.Namespace = "http://www.w3.org/2001/XMLSchema";
			xmlSchemaAny.MinOccurs = 0m;
			xmlSchemaAny.MaxOccurs = decimal.MaxValue;
			xmlSchemaAny.ProcessContents = XmlSchemaContentProcessing.Lax;
			xmlSchemaSequence.Items.Add(xmlSchemaAny);
			XmlSchemaAny xmlSchemaAny2 = new XmlSchemaAny();
			xmlSchemaAny2.Namespace = "urn:schemas-microsoft-com:xml-diffgram-v1";
			xmlSchemaAny2.MinOccurs = 1m;
			xmlSchemaAny2.ProcessContents = XmlSchemaContentProcessing.Lax;
			xmlSchemaSequence.Items.Add(xmlSchemaAny2);
			XmlSchemaAttribute xmlSchemaAttribute = new XmlSchemaAttribute();
			xmlSchemaAttribute.Name = "namespace";
			xmlSchemaAttribute.FixedValue = uIDataSet.Namespace;
			xmlSchemaComplexType.Attributes.Add(xmlSchemaAttribute);
			XmlSchemaAttribute xmlSchemaAttribute2 = new XmlSchemaAttribute();
			xmlSchemaAttribute2.Name = "tableTypeName";
			xmlSchemaAttribute2.FixedValue = "LabelItem_Flag2DataTable";
			xmlSchemaComplexType.Attributes.Add(xmlSchemaAttribute2);
			xmlSchemaComplexType.Particle = xmlSchemaSequence;
			XmlSchema schemaSerializable = uIDataSet.GetSchemaSerializable();
			if (xs.Contains(schemaSerializable.TargetNamespace))
			{
				MemoryStream memoryStream = new MemoryStream();
				MemoryStream memoryStream2 = new MemoryStream();
				try
				{
					XmlSchema xmlSchema = null;
					schemaSerializable.Write(memoryStream);
					IEnumerator enumerator = xs.Schemas(schemaSerializable.TargetNamespace).GetEnumerator();
					while (enumerator.MoveNext())
					{
						xmlSchema = (XmlSchema)enumerator.Current;
						memoryStream2.SetLength(0L);
						xmlSchema.Write(memoryStream2);
						if (memoryStream.Length == memoryStream2.Length)
						{
							memoryStream.Position = 0L;
							memoryStream2.Position = 0L;
							while (memoryStream.Position != memoryStream.Length && memoryStream.ReadByte() == memoryStream2.ReadByte())
							{
							}
							if (memoryStream.Position == memoryStream.Length)
							{
								return xmlSchemaComplexType;
							}
						}
					}
				}
				finally
				{
					memoryStream?.Close();
					memoryStream2?.Close();
				}
			}
			xs.Add(schemaSerializable);
			return xmlSchemaComplexType;
		}
	}

	[Serializable]
	[XmlSchemaProvider("GetTypedTableSchema")]
	public class LabelItem_Flag4DataTable : DataTable, IEnumerable
	{
		private DataColumn columnFlag1;

		private DataColumn columnFlag2;

		private DataColumn columnFlag4;

		private DataColumn columnDisplay;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public DataColumn Flag1Column => columnFlag1;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public DataColumn Flag2Column => columnFlag2;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public DataColumn Flag4Column => columnFlag4;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public DataColumn DisplayColumn => columnDisplay;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[Browsable(false)]
		public int Count => base.Rows.Count;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public LabelItem_Flag4Row this[int index] => (LabelItem_Flag4Row)base.Rows[index];

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public event LabelItem_Flag4RowChangeEventHandler LabelItem_Flag4RowChanging;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public event LabelItem_Flag4RowChangeEventHandler LabelItem_Flag4RowChanged;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public event LabelItem_Flag4RowChangeEventHandler LabelItem_Flag4RowDeleting;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public event LabelItem_Flag4RowChangeEventHandler LabelItem_Flag4RowDeleted;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public LabelItem_Flag4DataTable()
		{
			base.TableName = "LabelItem_Flag4";
			BeginInit();
			InitClass();
			EndInit();
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		internal LabelItem_Flag4DataTable(DataTable table)
		{
			base.TableName = table.TableName;
			if (table.CaseSensitive != table.DataSet.CaseSensitive)
			{
				base.CaseSensitive = table.CaseSensitive;
			}
			if (table.Locale.ToString() != table.DataSet.Locale.ToString())
			{
				base.Locale = table.Locale;
			}
			if (table.Namespace != table.DataSet.Namespace)
			{
				base.Namespace = table.Namespace;
			}
			base.Prefix = table.Prefix;
			base.MinimumCapacity = table.MinimumCapacity;
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		protected LabelItem_Flag4DataTable(SerializationInfo info, StreamingContext context)
			: base(info, context)
		{
			InitVars();
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public void AddLabelItem_Flag4Row(LabelItem_Flag4Row row)
		{
			base.Rows.Add(row);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public LabelItem_Flag4Row AddLabelItem_Flag4Row(int Flag1, int Flag2, int Flag4, string Display)
		{
			LabelItem_Flag4Row labelItem_Flag4Row = (LabelItem_Flag4Row)NewRow();
			object[] itemArray = new object[4] { Flag1, Flag2, Flag4, Display };
			labelItem_Flag4Row.ItemArray = itemArray;
			base.Rows.Add(labelItem_Flag4Row);
			return labelItem_Flag4Row;
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public LabelItem_Flag4Row FindByFlag1Flag2Flag4(int Flag1, int Flag2, int Flag4)
		{
			return (LabelItem_Flag4Row)base.Rows.Find(new object[3] { Flag1, Flag2, Flag4 });
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public virtual IEnumerator GetEnumerator()
		{
			return base.Rows.GetEnumerator();
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public override DataTable Clone()
		{
			LabelItem_Flag4DataTable labelItem_Flag4DataTable = (LabelItem_Flag4DataTable)base.Clone();
			labelItem_Flag4DataTable.InitVars();
			return labelItem_Flag4DataTable;
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		protected override DataTable CreateInstance()
		{
			return new LabelItem_Flag4DataTable();
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		internal void InitVars()
		{
			columnFlag1 = base.Columns["Flag1"];
			columnFlag2 = base.Columns["Flag2"];
			columnFlag4 = base.Columns["Flag4"];
			columnDisplay = base.Columns["Display"];
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		private void InitClass()
		{
			columnFlag1 = new DataColumn("Flag1", typeof(int), null, MappingType.Element);
			base.Columns.Add(columnFlag1);
			columnFlag2 = new DataColumn("Flag2", typeof(int), null, MappingType.Element);
			base.Columns.Add(columnFlag2);
			columnFlag4 = new DataColumn("Flag4", typeof(int), null, MappingType.Element);
			base.Columns.Add(columnFlag4);
			columnDisplay = new DataColumn("Display", typeof(string), null, MappingType.Element);
			base.Columns.Add(columnDisplay);
			base.Constraints.Add(new UniqueConstraint("Constraint1", new DataColumn[3] { columnFlag1, columnFlag2, columnFlag4 }, isPrimaryKey: true));
			columnFlag1.AllowDBNull = false;
			columnFlag2.AllowDBNull = false;
			columnFlag4.AllowDBNull = false;
			columnDisplay.AllowDBNull = false;
			columnDisplay.DefaultValue = "";
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public LabelItem_Flag4Row NewLabelItem_Flag4Row()
		{
			return (LabelItem_Flag4Row)NewRow();
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		protected override DataRow NewRowFromBuilder(DataRowBuilder builder)
		{
			return new LabelItem_Flag4Row(builder);
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		protected override Type GetRowType()
		{
			return typeof(LabelItem_Flag4Row);
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		protected override void OnRowChanged(DataRowChangeEventArgs e)
		{
			base.OnRowChanged(e);
			if (this.LabelItem_Flag4RowChanged != null)
			{
				this.LabelItem_Flag4RowChanged(this, new LabelItem_Flag4RowChangeEvent((LabelItem_Flag4Row)e.Row, e.Action));
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		protected override void OnRowChanging(DataRowChangeEventArgs e)
		{
			base.OnRowChanging(e);
			if (this.LabelItem_Flag4RowChanging != null)
			{
				this.LabelItem_Flag4RowChanging(this, new LabelItem_Flag4RowChangeEvent((LabelItem_Flag4Row)e.Row, e.Action));
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		protected override void OnRowDeleted(DataRowChangeEventArgs e)
		{
			base.OnRowDeleted(e);
			if (this.LabelItem_Flag4RowDeleted != null)
			{
				this.LabelItem_Flag4RowDeleted(this, new LabelItem_Flag4RowChangeEvent((LabelItem_Flag4Row)e.Row, e.Action));
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		protected override void OnRowDeleting(DataRowChangeEventArgs e)
		{
			base.OnRowDeleting(e);
			if (this.LabelItem_Flag4RowDeleting != null)
			{
				this.LabelItem_Flag4RowDeleting(this, new LabelItem_Flag4RowChangeEvent((LabelItem_Flag4Row)e.Row, e.Action));
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public void RemoveLabelItem_Flag4Row(LabelItem_Flag4Row row)
		{
			base.Rows.Remove(row);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public static XmlSchemaComplexType GetTypedTableSchema(XmlSchemaSet xs)
		{
			XmlSchemaComplexType xmlSchemaComplexType = new XmlSchemaComplexType();
			XmlSchemaSequence xmlSchemaSequence = new XmlSchemaSequence();
			UIDataSet uIDataSet = new UIDataSet();
			XmlSchemaAny xmlSchemaAny = new XmlSchemaAny();
			xmlSchemaAny.Namespace = "http://www.w3.org/2001/XMLSchema";
			xmlSchemaAny.MinOccurs = 0m;
			xmlSchemaAny.MaxOccurs = decimal.MaxValue;
			xmlSchemaAny.ProcessContents = XmlSchemaContentProcessing.Lax;
			xmlSchemaSequence.Items.Add(xmlSchemaAny);
			XmlSchemaAny xmlSchemaAny2 = new XmlSchemaAny();
			xmlSchemaAny2.Namespace = "urn:schemas-microsoft-com:xml-diffgram-v1";
			xmlSchemaAny2.MinOccurs = 1m;
			xmlSchemaAny2.ProcessContents = XmlSchemaContentProcessing.Lax;
			xmlSchemaSequence.Items.Add(xmlSchemaAny2);
			XmlSchemaAttribute xmlSchemaAttribute = new XmlSchemaAttribute();
			xmlSchemaAttribute.Name = "namespace";
			xmlSchemaAttribute.FixedValue = uIDataSet.Namespace;
			xmlSchemaComplexType.Attributes.Add(xmlSchemaAttribute);
			XmlSchemaAttribute xmlSchemaAttribute2 = new XmlSchemaAttribute();
			xmlSchemaAttribute2.Name = "tableTypeName";
			xmlSchemaAttribute2.FixedValue = "LabelItem_Flag4DataTable";
			xmlSchemaComplexType.Attributes.Add(xmlSchemaAttribute2);
			xmlSchemaComplexType.Particle = xmlSchemaSequence;
			XmlSchema schemaSerializable = uIDataSet.GetSchemaSerializable();
			if (xs.Contains(schemaSerializable.TargetNamespace))
			{
				MemoryStream memoryStream = new MemoryStream();
				MemoryStream memoryStream2 = new MemoryStream();
				try
				{
					XmlSchema xmlSchema = null;
					schemaSerializable.Write(memoryStream);
					IEnumerator enumerator = xs.Schemas(schemaSerializable.TargetNamespace).GetEnumerator();
					while (enumerator.MoveNext())
					{
						xmlSchema = (XmlSchema)enumerator.Current;
						memoryStream2.SetLength(0L);
						xmlSchema.Write(memoryStream2);
						if (memoryStream.Length == memoryStream2.Length)
						{
							memoryStream.Position = 0L;
							memoryStream2.Position = 0L;
							while (memoryStream.Position != memoryStream.Length && memoryStream.ReadByte() == memoryStream2.ReadByte())
							{
							}
							if (memoryStream.Position == memoryStream.Length)
							{
								return xmlSchemaComplexType;
							}
						}
					}
				}
				finally
				{
					memoryStream?.Close();
					memoryStream2?.Close();
				}
			}
			xs.Add(schemaSerializable);
			return xmlSchemaComplexType;
		}
	}

	[Serializable]
	[XmlSchemaProvider("GetTypedTableSchema")]
	public class LabelItem_Flag3DataTable : DataTable, IEnumerable
	{
		private DataColumn columnFlag1;

		private DataColumn columnFlag3;

		private DataColumn columnDisplay;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public DataColumn Flag1Column => columnFlag1;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public DataColumn Flag3Column => columnFlag3;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public DataColumn DisplayColumn => columnDisplay;

		[Browsable(false)]
		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public int Count => base.Rows.Count;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public LabelItem_Flag3Row this[int index] => (LabelItem_Flag3Row)base.Rows[index];

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public event LabelItem_Flag3RowChangeEventHandler LabelItem_Flag3RowChanging;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public event LabelItem_Flag3RowChangeEventHandler LabelItem_Flag3RowChanged;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public event LabelItem_Flag3RowChangeEventHandler LabelItem_Flag3RowDeleting;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public event LabelItem_Flag3RowChangeEventHandler LabelItem_Flag3RowDeleted;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public LabelItem_Flag3DataTable()
		{
			base.TableName = "LabelItem_Flag3";
			BeginInit();
			InitClass();
			EndInit();
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		internal LabelItem_Flag3DataTable(DataTable table)
		{
			base.TableName = table.TableName;
			if (table.CaseSensitive != table.DataSet.CaseSensitive)
			{
				base.CaseSensitive = table.CaseSensitive;
			}
			if (table.Locale.ToString() != table.DataSet.Locale.ToString())
			{
				base.Locale = table.Locale;
			}
			if (table.Namespace != table.DataSet.Namespace)
			{
				base.Namespace = table.Namespace;
			}
			base.Prefix = table.Prefix;
			base.MinimumCapacity = table.MinimumCapacity;
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		protected LabelItem_Flag3DataTable(SerializationInfo info, StreamingContext context)
			: base(info, context)
		{
			InitVars();
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public void AddLabelItem_Flag3Row(LabelItem_Flag3Row row)
		{
			base.Rows.Add(row);
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public LabelItem_Flag3Row AddLabelItem_Flag3Row(LabelItem_Flag1Row parentLabelItem_Flag1RowByLabelItem_Flag1_LabelItem_Flag3, int Flag3, string Display)
		{
			LabelItem_Flag3Row labelItem_Flag3Row = (LabelItem_Flag3Row)NewRow();
			object[] array = new object[3] { null, Flag3, Display };
			if (parentLabelItem_Flag1RowByLabelItem_Flag1_LabelItem_Flag3 != null)
			{
				array[0] = parentLabelItem_Flag1RowByLabelItem_Flag1_LabelItem_Flag3[0];
			}
			labelItem_Flag3Row.ItemArray = array;
			base.Rows.Add(labelItem_Flag3Row);
			return labelItem_Flag3Row;
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public LabelItem_Flag3Row FindByFlag1Flag3(int Flag1, int Flag3)
		{
			return (LabelItem_Flag3Row)base.Rows.Find(new object[2] { Flag1, Flag3 });
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public virtual IEnumerator GetEnumerator()
		{
			return base.Rows.GetEnumerator();
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public override DataTable Clone()
		{
			LabelItem_Flag3DataTable labelItem_Flag3DataTable = (LabelItem_Flag3DataTable)base.Clone();
			labelItem_Flag3DataTable.InitVars();
			return labelItem_Flag3DataTable;
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		protected override DataTable CreateInstance()
		{
			return new LabelItem_Flag3DataTable();
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		internal void InitVars()
		{
			columnFlag1 = base.Columns["Flag1"];
			columnFlag3 = base.Columns["Flag3"];
			columnDisplay = base.Columns["Display"];
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		private void InitClass()
		{
			columnFlag1 = new DataColumn("Flag1", typeof(int), null, MappingType.Element);
			base.Columns.Add(columnFlag1);
			columnFlag3 = new DataColumn("Flag3", typeof(int), null, MappingType.Element);
			base.Columns.Add(columnFlag3);
			columnDisplay = new DataColumn("Display", typeof(string), null, MappingType.Element);
			base.Columns.Add(columnDisplay);
			base.Constraints.Add(new UniqueConstraint("Constraint1", new DataColumn[2] { columnFlag1, columnFlag3 }, isPrimaryKey: true));
			columnFlag1.AllowDBNull = false;
			columnFlag3.AllowDBNull = false;
			columnDisplay.AllowDBNull = false;
			columnDisplay.DefaultValue = "";
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public LabelItem_Flag3Row NewLabelItem_Flag3Row()
		{
			return (LabelItem_Flag3Row)NewRow();
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		protected override DataRow NewRowFromBuilder(DataRowBuilder builder)
		{
			return new LabelItem_Flag3Row(builder);
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		protected override Type GetRowType()
		{
			return typeof(LabelItem_Flag3Row);
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		protected override void OnRowChanged(DataRowChangeEventArgs e)
		{
			base.OnRowChanged(e);
			if (this.LabelItem_Flag3RowChanged != null)
			{
				this.LabelItem_Flag3RowChanged(this, new LabelItem_Flag3RowChangeEvent((LabelItem_Flag3Row)e.Row, e.Action));
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		protected override void OnRowChanging(DataRowChangeEventArgs e)
		{
			base.OnRowChanging(e);
			if (this.LabelItem_Flag3RowChanging != null)
			{
				this.LabelItem_Flag3RowChanging(this, new LabelItem_Flag3RowChangeEvent((LabelItem_Flag3Row)e.Row, e.Action));
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		protected override void OnRowDeleted(DataRowChangeEventArgs e)
		{
			base.OnRowDeleted(e);
			if (this.LabelItem_Flag3RowDeleted != null)
			{
				this.LabelItem_Flag3RowDeleted(this, new LabelItem_Flag3RowChangeEvent((LabelItem_Flag3Row)e.Row, e.Action));
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		protected override void OnRowDeleting(DataRowChangeEventArgs e)
		{
			base.OnRowDeleting(e);
			if (this.LabelItem_Flag3RowDeleting != null)
			{
				this.LabelItem_Flag3RowDeleting(this, new LabelItem_Flag3RowChangeEvent((LabelItem_Flag3Row)e.Row, e.Action));
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public void RemoveLabelItem_Flag3Row(LabelItem_Flag3Row row)
		{
			base.Rows.Remove(row);
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public static XmlSchemaComplexType GetTypedTableSchema(XmlSchemaSet xs)
		{
			XmlSchemaComplexType xmlSchemaComplexType = new XmlSchemaComplexType();
			XmlSchemaSequence xmlSchemaSequence = new XmlSchemaSequence();
			UIDataSet uIDataSet = new UIDataSet();
			XmlSchemaAny xmlSchemaAny = new XmlSchemaAny();
			xmlSchemaAny.Namespace = "http://www.w3.org/2001/XMLSchema";
			xmlSchemaAny.MinOccurs = 0m;
			xmlSchemaAny.MaxOccurs = decimal.MaxValue;
			xmlSchemaAny.ProcessContents = XmlSchemaContentProcessing.Lax;
			xmlSchemaSequence.Items.Add(xmlSchemaAny);
			XmlSchemaAny xmlSchemaAny2 = new XmlSchemaAny();
			xmlSchemaAny2.Namespace = "urn:schemas-microsoft-com:xml-diffgram-v1";
			xmlSchemaAny2.MinOccurs = 1m;
			xmlSchemaAny2.ProcessContents = XmlSchemaContentProcessing.Lax;
			xmlSchemaSequence.Items.Add(xmlSchemaAny2);
			XmlSchemaAttribute xmlSchemaAttribute = new XmlSchemaAttribute();
			xmlSchemaAttribute.Name = "namespace";
			xmlSchemaAttribute.FixedValue = uIDataSet.Namespace;
			xmlSchemaComplexType.Attributes.Add(xmlSchemaAttribute);
			XmlSchemaAttribute xmlSchemaAttribute2 = new XmlSchemaAttribute();
			xmlSchemaAttribute2.Name = "tableTypeName";
			xmlSchemaAttribute2.FixedValue = "LabelItem_Flag3DataTable";
			xmlSchemaComplexType.Attributes.Add(xmlSchemaAttribute2);
			xmlSchemaComplexType.Particle = xmlSchemaSequence;
			XmlSchema schemaSerializable = uIDataSet.GetSchemaSerializable();
			if (xs.Contains(schemaSerializable.TargetNamespace))
			{
				MemoryStream memoryStream = new MemoryStream();
				MemoryStream memoryStream2 = new MemoryStream();
				try
				{
					XmlSchema xmlSchema = null;
					schemaSerializable.Write(memoryStream);
					IEnumerator enumerator = xs.Schemas(schemaSerializable.TargetNamespace).GetEnumerator();
					while (enumerator.MoveNext())
					{
						xmlSchema = (XmlSchema)enumerator.Current;
						memoryStream2.SetLength(0L);
						xmlSchema.Write(memoryStream2);
						if (memoryStream.Length == memoryStream2.Length)
						{
							memoryStream.Position = 0L;
							memoryStream2.Position = 0L;
							while (memoryStream.Position != memoryStream.Length && memoryStream.ReadByte() == memoryStream2.ReadByte())
							{
							}
							if (memoryStream.Position == memoryStream.Length)
							{
								return xmlSchemaComplexType;
							}
						}
					}
				}
				finally
				{
					memoryStream?.Close();
					memoryStream2?.Close();
				}
			}
			xs.Add(schemaSerializable);
			return xmlSchemaComplexType;
		}
	}

	[Serializable]
	[XmlSchemaProvider("GetTypedTableSchema")]
	public class PLU_ColDataTable : DataTable, IEnumerable
	{
		private DataColumn columnField;

		private DataColumn columnDisplay;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public DataColumn FieldColumn => columnField;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public DataColumn DisplayColumn => columnDisplay;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[Browsable(false)]
		[DebuggerNonUserCode]
		public int Count => base.Rows.Count;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public PLU_ColRow this[int index] => (PLU_ColRow)base.Rows[index];

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public event PLU_ColRowChangeEventHandler PLU_ColRowChanging;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public event PLU_ColRowChangeEventHandler PLU_ColRowChanged;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public event PLU_ColRowChangeEventHandler PLU_ColRowDeleting;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public event PLU_ColRowChangeEventHandler PLU_ColRowDeleted;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public PLU_ColDataTable()
		{
			base.TableName = "PLU_Col";
			BeginInit();
			InitClass();
			EndInit();
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		internal PLU_ColDataTable(DataTable table)
		{
			base.TableName = table.TableName;
			if (table.CaseSensitive != table.DataSet.CaseSensitive)
			{
				base.CaseSensitive = table.CaseSensitive;
			}
			if (table.Locale.ToString() != table.DataSet.Locale.ToString())
			{
				base.Locale = table.Locale;
			}
			if (table.Namespace != table.DataSet.Namespace)
			{
				base.Namespace = table.Namespace;
			}
			base.Prefix = table.Prefix;
			base.MinimumCapacity = table.MinimumCapacity;
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		protected PLU_ColDataTable(SerializationInfo info, StreamingContext context)
			: base(info, context)
		{
			InitVars();
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public void AddPLU_ColRow(PLU_ColRow row)
		{
			base.Rows.Add(row);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public PLU_ColRow AddPLU_ColRow(string Field, string Display)
		{
			PLU_ColRow pLU_ColRow = (PLU_ColRow)NewRow();
			object[] itemArray = new object[2] { Field, Display };
			pLU_ColRow.ItemArray = itemArray;
			base.Rows.Add(pLU_ColRow);
			return pLU_ColRow;
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public PLU_ColRow FindByField(string Field)
		{
			return (PLU_ColRow)base.Rows.Find(new object[1] { Field });
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public virtual IEnumerator GetEnumerator()
		{
			return base.Rows.GetEnumerator();
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public override DataTable Clone()
		{
			PLU_ColDataTable pLU_ColDataTable = (PLU_ColDataTable)base.Clone();
			pLU_ColDataTable.InitVars();
			return pLU_ColDataTable;
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		protected override DataTable CreateInstance()
		{
			return new PLU_ColDataTable();
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		internal void InitVars()
		{
			columnField = base.Columns["Field"];
			columnDisplay = base.Columns["Display"];
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		private void InitClass()
		{
			columnField = new DataColumn("Field", typeof(string), null, MappingType.Element);
			base.Columns.Add(columnField);
			columnDisplay = new DataColumn("Display", typeof(string), null, MappingType.Element);
			base.Columns.Add(columnDisplay);
			base.Constraints.Add(new UniqueConstraint("Constraint1", new DataColumn[1] { columnField }, isPrimaryKey: true));
			columnField.AllowDBNull = false;
			columnField.Unique = true;
			columnDisplay.AllowDBNull = false;
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public PLU_ColRow NewPLU_ColRow()
		{
			return (PLU_ColRow)NewRow();
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		protected override DataRow NewRowFromBuilder(DataRowBuilder builder)
		{
			return new PLU_ColRow(builder);
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		protected override Type GetRowType()
		{
			return typeof(PLU_ColRow);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		protected override void OnRowChanged(DataRowChangeEventArgs e)
		{
			base.OnRowChanged(e);
			if (this.PLU_ColRowChanged != null)
			{
				this.PLU_ColRowChanged(this, new PLU_ColRowChangeEvent((PLU_ColRow)e.Row, e.Action));
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		protected override void OnRowChanging(DataRowChangeEventArgs e)
		{
			base.OnRowChanging(e);
			if (this.PLU_ColRowChanging != null)
			{
				this.PLU_ColRowChanging(this, new PLU_ColRowChangeEvent((PLU_ColRow)e.Row, e.Action));
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		protected override void OnRowDeleted(DataRowChangeEventArgs e)
		{
			base.OnRowDeleted(e);
			if (this.PLU_ColRowDeleted != null)
			{
				this.PLU_ColRowDeleted(this, new PLU_ColRowChangeEvent((PLU_ColRow)e.Row, e.Action));
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		protected override void OnRowDeleting(DataRowChangeEventArgs e)
		{
			base.OnRowDeleting(e);
			if (this.PLU_ColRowDeleting != null)
			{
				this.PLU_ColRowDeleting(this, new PLU_ColRowChangeEvent((PLU_ColRow)e.Row, e.Action));
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public void RemovePLU_ColRow(PLU_ColRow row)
		{
			base.Rows.Remove(row);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public static XmlSchemaComplexType GetTypedTableSchema(XmlSchemaSet xs)
		{
			XmlSchemaComplexType xmlSchemaComplexType = new XmlSchemaComplexType();
			XmlSchemaSequence xmlSchemaSequence = new XmlSchemaSequence();
			UIDataSet uIDataSet = new UIDataSet();
			XmlSchemaAny xmlSchemaAny = new XmlSchemaAny();
			xmlSchemaAny.Namespace = "http://www.w3.org/2001/XMLSchema";
			xmlSchemaAny.MinOccurs = 0m;
			xmlSchemaAny.MaxOccurs = decimal.MaxValue;
			xmlSchemaAny.ProcessContents = XmlSchemaContentProcessing.Lax;
			xmlSchemaSequence.Items.Add(xmlSchemaAny);
			XmlSchemaAny xmlSchemaAny2 = new XmlSchemaAny();
			xmlSchemaAny2.Namespace = "urn:schemas-microsoft-com:xml-diffgram-v1";
			xmlSchemaAny2.MinOccurs = 1m;
			xmlSchemaAny2.ProcessContents = XmlSchemaContentProcessing.Lax;
			xmlSchemaSequence.Items.Add(xmlSchemaAny2);
			XmlSchemaAttribute xmlSchemaAttribute = new XmlSchemaAttribute();
			xmlSchemaAttribute.Name = "namespace";
			xmlSchemaAttribute.FixedValue = uIDataSet.Namespace;
			xmlSchemaComplexType.Attributes.Add(xmlSchemaAttribute);
			XmlSchemaAttribute xmlSchemaAttribute2 = new XmlSchemaAttribute();
			xmlSchemaAttribute2.Name = "tableTypeName";
			xmlSchemaAttribute2.FixedValue = "PLU_ColDataTable";
			xmlSchemaComplexType.Attributes.Add(xmlSchemaAttribute2);
			xmlSchemaComplexType.Particle = xmlSchemaSequence;
			XmlSchema schemaSerializable = uIDataSet.GetSchemaSerializable();
			if (xs.Contains(schemaSerializable.TargetNamespace))
			{
				MemoryStream memoryStream = new MemoryStream();
				MemoryStream memoryStream2 = new MemoryStream();
				try
				{
					XmlSchema xmlSchema = null;
					schemaSerializable.Write(memoryStream);
					IEnumerator enumerator = xs.Schemas(schemaSerializable.TargetNamespace).GetEnumerator();
					while (enumerator.MoveNext())
					{
						xmlSchema = (XmlSchema)enumerator.Current;
						memoryStream2.SetLength(0L);
						xmlSchema.Write(memoryStream2);
						if (memoryStream.Length == memoryStream2.Length)
						{
							memoryStream.Position = 0L;
							memoryStream2.Position = 0L;
							while (memoryStream.Position != memoryStream.Length && memoryStream.ReadByte() == memoryStream2.ReadByte())
							{
							}
							if (memoryStream.Position == memoryStream.Length)
							{
								return xmlSchemaComplexType;
							}
						}
					}
				}
				finally
				{
					memoryStream?.Close();
					memoryStream2?.Close();
				}
			}
			xs.Add(schemaSerializable);
			return xmlSchemaComplexType;
		}
	}

	[Serializable]
	[XmlSchemaProvider("GetTypedTableSchema")]
	public class ConfigDataTable : DataTable, IEnumerable
	{
		private DataColumn columnName;

		private DataColumn columnFolder;

		private DataColumn columnLang;

		private DataColumn columnEncoding;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public DataColumn NameColumn => columnName;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public DataColumn FolderColumn => columnFolder;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public DataColumn LangColumn => columnLang;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public DataColumn EncodingColumn => columnEncoding;

		[Browsable(false)]
		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public int Count => base.Rows.Count;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public ConfigRow this[int index] => (ConfigRow)base.Rows[index];

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public event ConfigRowChangeEventHandler ConfigRowChanging;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public event ConfigRowChangeEventHandler ConfigRowChanged;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public event ConfigRowChangeEventHandler ConfigRowDeleting;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public event ConfigRowChangeEventHandler ConfigRowDeleted;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public ConfigDataTable()
		{
			base.TableName = "Config";
			BeginInit();
			InitClass();
			EndInit();
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		internal ConfigDataTable(DataTable table)
		{
			base.TableName = table.TableName;
			if (table.CaseSensitive != table.DataSet.CaseSensitive)
			{
				base.CaseSensitive = table.CaseSensitive;
			}
			if (table.Locale.ToString() != table.DataSet.Locale.ToString())
			{
				base.Locale = table.Locale;
			}
			if (table.Namespace != table.DataSet.Namespace)
			{
				base.Namespace = table.Namespace;
			}
			base.Prefix = table.Prefix;
			base.MinimumCapacity = table.MinimumCapacity;
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		protected ConfigDataTable(SerializationInfo info, StreamingContext context)
			: base(info, context)
		{
			InitVars();
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public void AddConfigRow(ConfigRow row)
		{
			base.Rows.Add(row);
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public ConfigRow AddConfigRow(string Name, string Folder, string Lang, string Encoding)
		{
			ConfigRow configRow = (ConfigRow)NewRow();
			object[] itemArray = new object[4] { Name, Folder, Lang, Encoding };
			configRow.ItemArray = itemArray;
			base.Rows.Add(configRow);
			return configRow;
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public ConfigRow FindByName(string Name)
		{
			return (ConfigRow)base.Rows.Find(new object[1] { Name });
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public virtual IEnumerator GetEnumerator()
		{
			return base.Rows.GetEnumerator();
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public override DataTable Clone()
		{
			ConfigDataTable configDataTable = (ConfigDataTable)base.Clone();
			configDataTable.InitVars();
			return configDataTable;
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		protected override DataTable CreateInstance()
		{
			return new ConfigDataTable();
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		internal void InitVars()
		{
			columnName = base.Columns["Name"];
			columnFolder = base.Columns["Folder"];
			columnLang = base.Columns["Lang"];
			columnEncoding = base.Columns["Encoding"];
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		private void InitClass()
		{
			columnName = new DataColumn("Name", typeof(string), null, MappingType.Element);
			base.Columns.Add(columnName);
			columnFolder = new DataColumn("Folder", typeof(string), null, MappingType.Element);
			base.Columns.Add(columnFolder);
			columnLang = new DataColumn("Lang", typeof(string), null, MappingType.Element);
			base.Columns.Add(columnLang);
			columnEncoding = new DataColumn("Encoding", typeof(string), null, MappingType.Element);
			base.Columns.Add(columnEncoding);
			base.Constraints.Add(new UniqueConstraint("Constraint1", new DataColumn[1] { columnName }, isPrimaryKey: true));
			columnName.AllowDBNull = false;
			columnName.ReadOnly = true;
			columnName.Unique = true;
			columnFolder.AllowDBNull = false;
			columnLang.AllowDBNull = false;
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public ConfigRow NewConfigRow()
		{
			return (ConfigRow)NewRow();
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		protected override DataRow NewRowFromBuilder(DataRowBuilder builder)
		{
			return new ConfigRow(builder);
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		protected override Type GetRowType()
		{
			return typeof(ConfigRow);
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		protected override void OnRowChanged(DataRowChangeEventArgs e)
		{
			base.OnRowChanged(e);
			if (this.ConfigRowChanged != null)
			{
				this.ConfigRowChanged(this, new ConfigRowChangeEvent((ConfigRow)e.Row, e.Action));
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		protected override void OnRowChanging(DataRowChangeEventArgs e)
		{
			base.OnRowChanging(e);
			if (this.ConfigRowChanging != null)
			{
				this.ConfigRowChanging(this, new ConfigRowChangeEvent((ConfigRow)e.Row, e.Action));
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		protected override void OnRowDeleted(DataRowChangeEventArgs e)
		{
			base.OnRowDeleted(e);
			if (this.ConfigRowDeleted != null)
			{
				this.ConfigRowDeleted(this, new ConfigRowChangeEvent((ConfigRow)e.Row, e.Action));
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		protected override void OnRowDeleting(DataRowChangeEventArgs e)
		{
			base.OnRowDeleting(e);
			if (this.ConfigRowDeleting != null)
			{
				this.ConfigRowDeleting(this, new ConfigRowChangeEvent((ConfigRow)e.Row, e.Action));
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public void RemoveConfigRow(ConfigRow row)
		{
			base.Rows.Remove(row);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public static XmlSchemaComplexType GetTypedTableSchema(XmlSchemaSet xs)
		{
			XmlSchemaComplexType xmlSchemaComplexType = new XmlSchemaComplexType();
			XmlSchemaSequence xmlSchemaSequence = new XmlSchemaSequence();
			UIDataSet uIDataSet = new UIDataSet();
			XmlSchemaAny xmlSchemaAny = new XmlSchemaAny();
			xmlSchemaAny.Namespace = "http://www.w3.org/2001/XMLSchema";
			xmlSchemaAny.MinOccurs = 0m;
			xmlSchemaAny.MaxOccurs = decimal.MaxValue;
			xmlSchemaAny.ProcessContents = XmlSchemaContentProcessing.Lax;
			xmlSchemaSequence.Items.Add(xmlSchemaAny);
			XmlSchemaAny xmlSchemaAny2 = new XmlSchemaAny();
			xmlSchemaAny2.Namespace = "urn:schemas-microsoft-com:xml-diffgram-v1";
			xmlSchemaAny2.MinOccurs = 1m;
			xmlSchemaAny2.ProcessContents = XmlSchemaContentProcessing.Lax;
			xmlSchemaSequence.Items.Add(xmlSchemaAny2);
			XmlSchemaAttribute xmlSchemaAttribute = new XmlSchemaAttribute();
			xmlSchemaAttribute.Name = "namespace";
			xmlSchemaAttribute.FixedValue = uIDataSet.Namespace;
			xmlSchemaComplexType.Attributes.Add(xmlSchemaAttribute);
			XmlSchemaAttribute xmlSchemaAttribute2 = new XmlSchemaAttribute();
			xmlSchemaAttribute2.Name = "tableTypeName";
			xmlSchemaAttribute2.FixedValue = "ConfigDataTable";
			xmlSchemaComplexType.Attributes.Add(xmlSchemaAttribute2);
			xmlSchemaComplexType.Particle = xmlSchemaSequence;
			XmlSchema schemaSerializable = uIDataSet.GetSchemaSerializable();
			if (xs.Contains(schemaSerializable.TargetNamespace))
			{
				MemoryStream memoryStream = new MemoryStream();
				MemoryStream memoryStream2 = new MemoryStream();
				try
				{
					XmlSchema xmlSchema = null;
					schemaSerializable.Write(memoryStream);
					IEnumerator enumerator = xs.Schemas(schemaSerializable.TargetNamespace).GetEnumerator();
					while (enumerator.MoveNext())
					{
						xmlSchema = (XmlSchema)enumerator.Current;
						memoryStream2.SetLength(0L);
						xmlSchema.Write(memoryStream2);
						if (memoryStream.Length == memoryStream2.Length)
						{
							memoryStream.Position = 0L;
							memoryStream2.Position = 0L;
							while (memoryStream.Position != memoryStream.Length && memoryStream.ReadByte() == memoryStream2.ReadByte())
							{
							}
							if (memoryStream.Position == memoryStream.Length)
							{
								return xmlSchemaComplexType;
							}
						}
					}
				}
				finally
				{
					memoryStream?.Close();
					memoryStream2?.Close();
				}
			}
			xs.Add(schemaSerializable);
			return xmlSchemaComplexType;
		}
	}

	[Serializable]
	[XmlSchemaProvider("GetTypedTableSchema")]
	public class Unit_TypeDataTable : DataTable, IEnumerable
	{
		private DataColumn columnValue;

		private DataColumn columnDisplay;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public DataColumn ValueColumn => columnValue;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public DataColumn DisplayColumn => columnDisplay;

		[DebuggerNonUserCode]
		[Browsable(false)]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public int Count => base.Rows.Count;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public Unit_TypeRow this[int index] => (Unit_TypeRow)base.Rows[index];

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public event Unit_TypeRowChangeEventHandler Unit_TypeRowChanging;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public event Unit_TypeRowChangeEventHandler Unit_TypeRowChanged;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public event Unit_TypeRowChangeEventHandler Unit_TypeRowDeleting;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public event Unit_TypeRowChangeEventHandler Unit_TypeRowDeleted;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public Unit_TypeDataTable()
		{
			base.TableName = "Unit_Type";
			BeginInit();
			InitClass();
			EndInit();
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		internal Unit_TypeDataTable(DataTable table)
		{
			base.TableName = table.TableName;
			if (table.CaseSensitive != table.DataSet.CaseSensitive)
			{
				base.CaseSensitive = table.CaseSensitive;
			}
			if (table.Locale.ToString() != table.DataSet.Locale.ToString())
			{
				base.Locale = table.Locale;
			}
			if (table.Namespace != table.DataSet.Namespace)
			{
				base.Namespace = table.Namespace;
			}
			base.Prefix = table.Prefix;
			base.MinimumCapacity = table.MinimumCapacity;
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		protected Unit_TypeDataTable(SerializationInfo info, StreamingContext context)
			: base(info, context)
		{
			InitVars();
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public void AddUnit_TypeRow(Unit_TypeRow row)
		{
			base.Rows.Add(row);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public Unit_TypeRow AddUnit_TypeRow(int Value, string Display)
		{
			Unit_TypeRow unit_TypeRow = (Unit_TypeRow)NewRow();
			object[] itemArray = new object[2] { Value, Display };
			unit_TypeRow.ItemArray = itemArray;
			base.Rows.Add(unit_TypeRow);
			return unit_TypeRow;
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public Unit_TypeRow FindByValue(int Value)
		{
			return (Unit_TypeRow)base.Rows.Find(new object[1] { Value });
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public virtual IEnumerator GetEnumerator()
		{
			return base.Rows.GetEnumerator();
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public override DataTable Clone()
		{
			Unit_TypeDataTable unit_TypeDataTable = (Unit_TypeDataTable)base.Clone();
			unit_TypeDataTable.InitVars();
			return unit_TypeDataTable;
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		protected override DataTable CreateInstance()
		{
			return new Unit_TypeDataTable();
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		internal void InitVars()
		{
			columnValue = base.Columns["Value"];
			columnDisplay = base.Columns["Display"];
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		private void InitClass()
		{
			columnValue = new DataColumn("Value", typeof(int), null, MappingType.Element);
			base.Columns.Add(columnValue);
			columnDisplay = new DataColumn("Display", typeof(string), null, MappingType.Element);
			base.Columns.Add(columnDisplay);
			base.Constraints.Add(new UniqueConstraint("Constraint1", new DataColumn[1] { columnValue }, isPrimaryKey: true));
			columnValue.AllowDBNull = false;
			columnValue.Unique = true;
			columnDisplay.AllowDBNull = false;
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public Unit_TypeRow NewUnit_TypeRow()
		{
			return (Unit_TypeRow)NewRow();
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		protected override DataRow NewRowFromBuilder(DataRowBuilder builder)
		{
			return new Unit_TypeRow(builder);
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		protected override Type GetRowType()
		{
			return typeof(Unit_TypeRow);
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		protected override void OnRowChanged(DataRowChangeEventArgs e)
		{
			base.OnRowChanged(e);
			if (this.Unit_TypeRowChanged != null)
			{
				this.Unit_TypeRowChanged(this, new Unit_TypeRowChangeEvent((Unit_TypeRow)e.Row, e.Action));
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		protected override void OnRowChanging(DataRowChangeEventArgs e)
		{
			base.OnRowChanging(e);
			if (this.Unit_TypeRowChanging != null)
			{
				this.Unit_TypeRowChanging(this, new Unit_TypeRowChangeEvent((Unit_TypeRow)e.Row, e.Action));
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		protected override void OnRowDeleted(DataRowChangeEventArgs e)
		{
			base.OnRowDeleted(e);
			if (this.Unit_TypeRowDeleted != null)
			{
				this.Unit_TypeRowDeleted(this, new Unit_TypeRowChangeEvent((Unit_TypeRow)e.Row, e.Action));
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		protected override void OnRowDeleting(DataRowChangeEventArgs e)
		{
			base.OnRowDeleting(e);
			if (this.Unit_TypeRowDeleting != null)
			{
				this.Unit_TypeRowDeleting(this, new Unit_TypeRowChangeEvent((Unit_TypeRow)e.Row, e.Action));
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public void RemoveUnit_TypeRow(Unit_TypeRow row)
		{
			base.Rows.Remove(row);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public static XmlSchemaComplexType GetTypedTableSchema(XmlSchemaSet xs)
		{
			XmlSchemaComplexType xmlSchemaComplexType = new XmlSchemaComplexType();
			XmlSchemaSequence xmlSchemaSequence = new XmlSchemaSequence();
			UIDataSet uIDataSet = new UIDataSet();
			XmlSchemaAny xmlSchemaAny = new XmlSchemaAny();
			xmlSchemaAny.Namespace = "http://www.w3.org/2001/XMLSchema";
			xmlSchemaAny.MinOccurs = 0m;
			xmlSchemaAny.MaxOccurs = decimal.MaxValue;
			xmlSchemaAny.ProcessContents = XmlSchemaContentProcessing.Lax;
			xmlSchemaSequence.Items.Add(xmlSchemaAny);
			XmlSchemaAny xmlSchemaAny2 = new XmlSchemaAny();
			xmlSchemaAny2.Namespace = "urn:schemas-microsoft-com:xml-diffgram-v1";
			xmlSchemaAny2.MinOccurs = 1m;
			xmlSchemaAny2.ProcessContents = XmlSchemaContentProcessing.Lax;
			xmlSchemaSequence.Items.Add(xmlSchemaAny2);
			XmlSchemaAttribute xmlSchemaAttribute = new XmlSchemaAttribute();
			xmlSchemaAttribute.Name = "namespace";
			xmlSchemaAttribute.FixedValue = uIDataSet.Namespace;
			xmlSchemaComplexType.Attributes.Add(xmlSchemaAttribute);
			XmlSchemaAttribute xmlSchemaAttribute2 = new XmlSchemaAttribute();
			xmlSchemaAttribute2.Name = "tableTypeName";
			xmlSchemaAttribute2.FixedValue = "Unit_TypeDataTable";
			xmlSchemaComplexType.Attributes.Add(xmlSchemaAttribute2);
			xmlSchemaComplexType.Particle = xmlSchemaSequence;
			XmlSchema schemaSerializable = uIDataSet.GetSchemaSerializable();
			if (xs.Contains(schemaSerializable.TargetNamespace))
			{
				MemoryStream memoryStream = new MemoryStream();
				MemoryStream memoryStream2 = new MemoryStream();
				try
				{
					XmlSchema xmlSchema = null;
					schemaSerializable.Write(memoryStream);
					IEnumerator enumerator = xs.Schemas(schemaSerializable.TargetNamespace).GetEnumerator();
					while (enumerator.MoveNext())
					{
						xmlSchema = (XmlSchema)enumerator.Current;
						memoryStream2.SetLength(0L);
						xmlSchema.Write(memoryStream2);
						if (memoryStream.Length == memoryStream2.Length)
						{
							memoryStream.Position = 0L;
							memoryStream2.Position = 0L;
							while (memoryStream.Position != memoryStream.Length && memoryStream.ReadByte() == memoryStream2.ReadByte())
							{
							}
							if (memoryStream.Position == memoryStream.Length)
							{
								return xmlSchemaComplexType;
							}
						}
					}
				}
				finally
				{
					memoryStream?.Close();
					memoryStream2?.Close();
				}
			}
			xs.Add(schemaSerializable);
			return xmlSchemaComplexType;
		}
	}

	[Serializable]
	[XmlSchemaProvider("GetTypedTableSchema")]
	public class LabelItem_Font2DataTable : DataTable, IEnumerable
	{
		private DataColumn columnValue;

		private DataColumn columnDisplay;

		private DataColumn columnSize;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public DataColumn ValueColumn => columnValue;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public DataColumn DisplayColumn => columnDisplay;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public DataColumn SizeColumn => columnSize;

		[DebuggerNonUserCode]
		[Browsable(false)]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public int Count => base.Rows.Count;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public LabelItem_Font2Row this[int index] => (LabelItem_Font2Row)base.Rows[index];

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public event LabelItem_Font2RowChangeEventHandler LabelItem_Font2RowChanging;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public event LabelItem_Font2RowChangeEventHandler LabelItem_Font2RowChanged;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public event LabelItem_Font2RowChangeEventHandler LabelItem_Font2RowDeleting;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public event LabelItem_Font2RowChangeEventHandler LabelItem_Font2RowDeleted;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public LabelItem_Font2DataTable()
		{
			base.TableName = "LabelItem_Font2";
			BeginInit();
			InitClass();
			EndInit();
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		internal LabelItem_Font2DataTable(DataTable table)
		{
			base.TableName = table.TableName;
			if (table.CaseSensitive != table.DataSet.CaseSensitive)
			{
				base.CaseSensitive = table.CaseSensitive;
			}
			if (table.Locale.ToString() != table.DataSet.Locale.ToString())
			{
				base.Locale = table.Locale;
			}
			if (table.Namespace != table.DataSet.Namespace)
			{
				base.Namespace = table.Namespace;
			}
			base.Prefix = table.Prefix;
			base.MinimumCapacity = table.MinimumCapacity;
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		protected LabelItem_Font2DataTable(SerializationInfo info, StreamingContext context)
			: base(info, context)
		{
			InitVars();
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public void AddLabelItem_Font2Row(LabelItem_Font2Row row)
		{
			base.Rows.Add(row);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public LabelItem_Font2Row AddLabelItem_Font2Row(int Value, string Display, int Size)
		{
			LabelItem_Font2Row labelItem_Font2Row = (LabelItem_Font2Row)NewRow();
			object[] itemArray = new object[3] { Value, Display, Size };
			labelItem_Font2Row.ItemArray = itemArray;
			base.Rows.Add(labelItem_Font2Row);
			return labelItem_Font2Row;
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public LabelItem_Font2Row FindByValue(int Value)
		{
			return (LabelItem_Font2Row)base.Rows.Find(new object[1] { Value });
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public virtual IEnumerator GetEnumerator()
		{
			return base.Rows.GetEnumerator();
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public override DataTable Clone()
		{
			LabelItem_Font2DataTable labelItem_Font2DataTable = (LabelItem_Font2DataTable)base.Clone();
			labelItem_Font2DataTable.InitVars();
			return labelItem_Font2DataTable;
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		protected override DataTable CreateInstance()
		{
			return new LabelItem_Font2DataTable();
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		internal void InitVars()
		{
			columnValue = base.Columns["Value"];
			columnDisplay = base.Columns["Display"];
			columnSize = base.Columns["Size"];
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		private void InitClass()
		{
			columnValue = new DataColumn("Value", typeof(int), null, MappingType.Element);
			base.Columns.Add(columnValue);
			columnDisplay = new DataColumn("Display", typeof(string), null, MappingType.Element);
			base.Columns.Add(columnDisplay);
			columnSize = new DataColumn("Size", typeof(int), null, MappingType.Element);
			base.Columns.Add(columnSize);
			base.Constraints.Add(new UniqueConstraint("Constraint1", new DataColumn[1] { columnValue }, isPrimaryKey: true));
			columnValue.AllowDBNull = false;
			columnValue.Unique = true;
			columnDisplay.AllowDBNull = false;
			columnSize.AllowDBNull = false;
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public LabelItem_Font2Row NewLabelItem_Font2Row()
		{
			return (LabelItem_Font2Row)NewRow();
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		protected override DataRow NewRowFromBuilder(DataRowBuilder builder)
		{
			return new LabelItem_Font2Row(builder);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		protected override Type GetRowType()
		{
			return typeof(LabelItem_Font2Row);
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		protected override void OnRowChanged(DataRowChangeEventArgs e)
		{
			base.OnRowChanged(e);
			if (this.LabelItem_Font2RowChanged != null)
			{
				this.LabelItem_Font2RowChanged(this, new LabelItem_Font2RowChangeEvent((LabelItem_Font2Row)e.Row, e.Action));
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		protected override void OnRowChanging(DataRowChangeEventArgs e)
		{
			base.OnRowChanging(e);
			if (this.LabelItem_Font2RowChanging != null)
			{
				this.LabelItem_Font2RowChanging(this, new LabelItem_Font2RowChangeEvent((LabelItem_Font2Row)e.Row, e.Action));
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		protected override void OnRowDeleted(DataRowChangeEventArgs e)
		{
			base.OnRowDeleted(e);
			if (this.LabelItem_Font2RowDeleted != null)
			{
				this.LabelItem_Font2RowDeleted(this, new LabelItem_Font2RowChangeEvent((LabelItem_Font2Row)e.Row, e.Action));
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		protected override void OnRowDeleting(DataRowChangeEventArgs e)
		{
			base.OnRowDeleting(e);
			if (this.LabelItem_Font2RowDeleting != null)
			{
				this.LabelItem_Font2RowDeleting(this, new LabelItem_Font2RowChangeEvent((LabelItem_Font2Row)e.Row, e.Action));
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public void RemoveLabelItem_Font2Row(LabelItem_Font2Row row)
		{
			base.Rows.Remove(row);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public static XmlSchemaComplexType GetTypedTableSchema(XmlSchemaSet xs)
		{
			XmlSchemaComplexType xmlSchemaComplexType = new XmlSchemaComplexType();
			XmlSchemaSequence xmlSchemaSequence = new XmlSchemaSequence();
			UIDataSet uIDataSet = new UIDataSet();
			XmlSchemaAny xmlSchemaAny = new XmlSchemaAny();
			xmlSchemaAny.Namespace = "http://www.w3.org/2001/XMLSchema";
			xmlSchemaAny.MinOccurs = 0m;
			xmlSchemaAny.MaxOccurs = decimal.MaxValue;
			xmlSchemaAny.ProcessContents = XmlSchemaContentProcessing.Lax;
			xmlSchemaSequence.Items.Add(xmlSchemaAny);
			XmlSchemaAny xmlSchemaAny2 = new XmlSchemaAny();
			xmlSchemaAny2.Namespace = "urn:schemas-microsoft-com:xml-diffgram-v1";
			xmlSchemaAny2.MinOccurs = 1m;
			xmlSchemaAny2.ProcessContents = XmlSchemaContentProcessing.Lax;
			xmlSchemaSequence.Items.Add(xmlSchemaAny2);
			XmlSchemaAttribute xmlSchemaAttribute = new XmlSchemaAttribute();
			xmlSchemaAttribute.Name = "namespace";
			xmlSchemaAttribute.FixedValue = uIDataSet.Namespace;
			xmlSchemaComplexType.Attributes.Add(xmlSchemaAttribute);
			XmlSchemaAttribute xmlSchemaAttribute2 = new XmlSchemaAttribute();
			xmlSchemaAttribute2.Name = "tableTypeName";
			xmlSchemaAttribute2.FixedValue = "LabelItem_Font2DataTable";
			xmlSchemaComplexType.Attributes.Add(xmlSchemaAttribute2);
			xmlSchemaComplexType.Particle = xmlSchemaSequence;
			XmlSchema schemaSerializable = uIDataSet.GetSchemaSerializable();
			if (xs.Contains(schemaSerializable.TargetNamespace))
			{
				MemoryStream memoryStream = new MemoryStream();
				MemoryStream memoryStream2 = new MemoryStream();
				try
				{
					XmlSchema xmlSchema = null;
					schemaSerializable.Write(memoryStream);
					IEnumerator enumerator = xs.Schemas(schemaSerializable.TargetNamespace).GetEnumerator();
					while (enumerator.MoveNext())
					{
						xmlSchema = (XmlSchema)enumerator.Current;
						memoryStream2.SetLength(0L);
						xmlSchema.Write(memoryStream2);
						if (memoryStream.Length == memoryStream2.Length)
						{
							memoryStream.Position = 0L;
							memoryStream2.Position = 0L;
							while (memoryStream.Position != memoryStream.Length && memoryStream.ReadByte() == memoryStream2.ReadByte())
							{
							}
							if (memoryStream.Position == memoryStream.Length)
							{
								return xmlSchemaComplexType;
							}
						}
					}
				}
				finally
				{
					memoryStream?.Close();
					memoryStream2?.Close();
				}
			}
			xs.Add(schemaSerializable);
			return xmlSchemaComplexType;
		}
	}

	[Serializable]
	[XmlSchemaProvider("GetTypedTableSchema")]
	public class Label_VersionDataTable : DataTable, IEnumerable
	{
		private DataColumn columnValue;

		private DataColumn columnDisplay;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public DataColumn ValueColumn => columnValue;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public DataColumn DisplayColumn => columnDisplay;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[Browsable(false)]
		public int Count => base.Rows.Count;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public Label_VersionRow this[int index] => (Label_VersionRow)base.Rows[index];

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public event Label_VersionRowChangeEventHandler Label_VersionRowChanging;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public event Label_VersionRowChangeEventHandler Label_VersionRowChanged;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public event Label_VersionRowChangeEventHandler Label_VersionRowDeleting;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public event Label_VersionRowChangeEventHandler Label_VersionRowDeleted;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public Label_VersionDataTable()
		{
			base.TableName = "Label_Version";
			BeginInit();
			InitClass();
			EndInit();
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		internal Label_VersionDataTable(DataTable table)
		{
			base.TableName = table.TableName;
			if (table.CaseSensitive != table.DataSet.CaseSensitive)
			{
				base.CaseSensitive = table.CaseSensitive;
			}
			if (table.Locale.ToString() != table.DataSet.Locale.ToString())
			{
				base.Locale = table.Locale;
			}
			if (table.Namespace != table.DataSet.Namespace)
			{
				base.Namespace = table.Namespace;
			}
			base.Prefix = table.Prefix;
			base.MinimumCapacity = table.MinimumCapacity;
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		protected Label_VersionDataTable(SerializationInfo info, StreamingContext context)
			: base(info, context)
		{
			InitVars();
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public void AddLabel_VersionRow(Label_VersionRow row)
		{
			base.Rows.Add(row);
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public Label_VersionRow AddLabel_VersionRow(int Value, string Display)
		{
			Label_VersionRow label_VersionRow = (Label_VersionRow)NewRow();
			object[] itemArray = new object[2] { Value, Display };
			label_VersionRow.ItemArray = itemArray;
			base.Rows.Add(label_VersionRow);
			return label_VersionRow;
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public Label_VersionRow FindByValue(int Value)
		{
			return (Label_VersionRow)base.Rows.Find(new object[1] { Value });
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public virtual IEnumerator GetEnumerator()
		{
			return base.Rows.GetEnumerator();
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public override DataTable Clone()
		{
			Label_VersionDataTable label_VersionDataTable = (Label_VersionDataTable)base.Clone();
			label_VersionDataTable.InitVars();
			return label_VersionDataTable;
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		protected override DataTable CreateInstance()
		{
			return new Label_VersionDataTable();
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		internal void InitVars()
		{
			columnValue = base.Columns["Value"];
			columnDisplay = base.Columns["Display"];
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		private void InitClass()
		{
			columnValue = new DataColumn("Value", typeof(int), null, MappingType.Element);
			base.Columns.Add(columnValue);
			columnDisplay = new DataColumn("Display", typeof(string), null, MappingType.Element);
			base.Columns.Add(columnDisplay);
			base.Constraints.Add(new UniqueConstraint("Constraint1", new DataColumn[1] { columnValue }, isPrimaryKey: true));
			columnValue.AllowDBNull = false;
			columnValue.Unique = true;
			columnDisplay.AllowDBNull = false;
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public Label_VersionRow NewLabel_VersionRow()
		{
			return (Label_VersionRow)NewRow();
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		protected override DataRow NewRowFromBuilder(DataRowBuilder builder)
		{
			return new Label_VersionRow(builder);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		protected override Type GetRowType()
		{
			return typeof(Label_VersionRow);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		protected override void OnRowChanged(DataRowChangeEventArgs e)
		{
			base.OnRowChanged(e);
			if (this.Label_VersionRowChanged != null)
			{
				this.Label_VersionRowChanged(this, new Label_VersionRowChangeEvent((Label_VersionRow)e.Row, e.Action));
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		protected override void OnRowChanging(DataRowChangeEventArgs e)
		{
			base.OnRowChanging(e);
			if (this.Label_VersionRowChanging != null)
			{
				this.Label_VersionRowChanging(this, new Label_VersionRowChangeEvent((Label_VersionRow)e.Row, e.Action));
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		protected override void OnRowDeleted(DataRowChangeEventArgs e)
		{
			base.OnRowDeleted(e);
			if (this.Label_VersionRowDeleted != null)
			{
				this.Label_VersionRowDeleted(this, new Label_VersionRowChangeEvent((Label_VersionRow)e.Row, e.Action));
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		protected override void OnRowDeleting(DataRowChangeEventArgs e)
		{
			base.OnRowDeleting(e);
			if (this.Label_VersionRowDeleting != null)
			{
				this.Label_VersionRowDeleting(this, new Label_VersionRowChangeEvent((Label_VersionRow)e.Row, e.Action));
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public void RemoveLabel_VersionRow(Label_VersionRow row)
		{
			base.Rows.Remove(row);
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public static XmlSchemaComplexType GetTypedTableSchema(XmlSchemaSet xs)
		{
			XmlSchemaComplexType xmlSchemaComplexType = new XmlSchemaComplexType();
			XmlSchemaSequence xmlSchemaSequence = new XmlSchemaSequence();
			UIDataSet uIDataSet = new UIDataSet();
			XmlSchemaAny xmlSchemaAny = new XmlSchemaAny();
			xmlSchemaAny.Namespace = "http://www.w3.org/2001/XMLSchema";
			xmlSchemaAny.MinOccurs = 0m;
			xmlSchemaAny.MaxOccurs = decimal.MaxValue;
			xmlSchemaAny.ProcessContents = XmlSchemaContentProcessing.Lax;
			xmlSchemaSequence.Items.Add(xmlSchemaAny);
			XmlSchemaAny xmlSchemaAny2 = new XmlSchemaAny();
			xmlSchemaAny2.Namespace = "urn:schemas-microsoft-com:xml-diffgram-v1";
			xmlSchemaAny2.MinOccurs = 1m;
			xmlSchemaAny2.ProcessContents = XmlSchemaContentProcessing.Lax;
			xmlSchemaSequence.Items.Add(xmlSchemaAny2);
			XmlSchemaAttribute xmlSchemaAttribute = new XmlSchemaAttribute();
			xmlSchemaAttribute.Name = "namespace";
			xmlSchemaAttribute.FixedValue = uIDataSet.Namespace;
			xmlSchemaComplexType.Attributes.Add(xmlSchemaAttribute);
			XmlSchemaAttribute xmlSchemaAttribute2 = new XmlSchemaAttribute();
			xmlSchemaAttribute2.Name = "tableTypeName";
			xmlSchemaAttribute2.FixedValue = "Label_VersionDataTable";
			xmlSchemaComplexType.Attributes.Add(xmlSchemaAttribute2);
			xmlSchemaComplexType.Particle = xmlSchemaSequence;
			XmlSchema schemaSerializable = uIDataSet.GetSchemaSerializable();
			if (xs.Contains(schemaSerializable.TargetNamespace))
			{
				MemoryStream memoryStream = new MemoryStream();
				MemoryStream memoryStream2 = new MemoryStream();
				try
				{
					XmlSchema xmlSchema = null;
					schemaSerializable.Write(memoryStream);
					IEnumerator enumerator = xs.Schemas(schemaSerializable.TargetNamespace).GetEnumerator();
					while (enumerator.MoveNext())
					{
						xmlSchema = (XmlSchema)enumerator.Current;
						memoryStream2.SetLength(0L);
						xmlSchema.Write(memoryStream2);
						if (memoryStream.Length == memoryStream2.Length)
						{
							memoryStream.Position = 0L;
							memoryStream2.Position = 0L;
							while (memoryStream.Position != memoryStream.Length && memoryStream.ReadByte() == memoryStream2.ReadByte())
							{
							}
							if (memoryStream.Position == memoryStream.Length)
							{
								return xmlSchemaComplexType;
							}
						}
					}
				}
				finally
				{
					memoryStream?.Close();
					memoryStream2?.Close();
				}
			}
			xs.Add(schemaSerializable);
			return xmlSchemaComplexType;
		}
	}

	[Serializable]
	[XmlSchemaProvider("GetTypedTableSchema")]
	public class PLU_TaxTypeDataTable : DataTable, IEnumerable
	{
		private DataColumn columnValue;

		private DataColumn columnDisplay;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public DataColumn ValueColumn => columnValue;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public DataColumn DisplayColumn => columnDisplay;

		[DebuggerNonUserCode]
		[Browsable(false)]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public int Count => base.Rows.Count;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public PLU_TaxTypeRow this[int index] => (PLU_TaxTypeRow)base.Rows[index];

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public event PLU_TaxTypeRowChangeEventHandler PLU_TaxTypeRowChanging;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public event PLU_TaxTypeRowChangeEventHandler PLU_TaxTypeRowChanged;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public event PLU_TaxTypeRowChangeEventHandler PLU_TaxTypeRowDeleting;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public event PLU_TaxTypeRowChangeEventHandler PLU_TaxTypeRowDeleted;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public PLU_TaxTypeDataTable()
		{
			base.TableName = "PLU_TaxType";
			BeginInit();
			InitClass();
			EndInit();
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		internal PLU_TaxTypeDataTable(DataTable table)
		{
			base.TableName = table.TableName;
			if (table.CaseSensitive != table.DataSet.CaseSensitive)
			{
				base.CaseSensitive = table.CaseSensitive;
			}
			if (table.Locale.ToString() != table.DataSet.Locale.ToString())
			{
				base.Locale = table.Locale;
			}
			if (table.Namespace != table.DataSet.Namespace)
			{
				base.Namespace = table.Namespace;
			}
			base.Prefix = table.Prefix;
			base.MinimumCapacity = table.MinimumCapacity;
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		protected PLU_TaxTypeDataTable(SerializationInfo info, StreamingContext context)
			: base(info, context)
		{
			InitVars();
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public void AddPLU_TaxTypeRow(PLU_TaxTypeRow row)
		{
			base.Rows.Add(row);
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public PLU_TaxTypeRow AddPLU_TaxTypeRow(int Value, string Display)
		{
			PLU_TaxTypeRow pLU_TaxTypeRow = (PLU_TaxTypeRow)NewRow();
			object[] itemArray = new object[2] { Value, Display };
			pLU_TaxTypeRow.ItemArray = itemArray;
			base.Rows.Add(pLU_TaxTypeRow);
			return pLU_TaxTypeRow;
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public PLU_TaxTypeRow FindByValue(int Value)
		{
			return (PLU_TaxTypeRow)base.Rows.Find(new object[1] { Value });
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public virtual IEnumerator GetEnumerator()
		{
			return base.Rows.GetEnumerator();
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public override DataTable Clone()
		{
			PLU_TaxTypeDataTable pLU_TaxTypeDataTable = (PLU_TaxTypeDataTable)base.Clone();
			pLU_TaxTypeDataTable.InitVars();
			return pLU_TaxTypeDataTable;
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		protected override DataTable CreateInstance()
		{
			return new PLU_TaxTypeDataTable();
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		internal void InitVars()
		{
			columnValue = base.Columns["Value"];
			columnDisplay = base.Columns["Display"];
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		private void InitClass()
		{
			columnValue = new DataColumn("Value", typeof(int), null, MappingType.Element);
			base.Columns.Add(columnValue);
			columnDisplay = new DataColumn("Display", typeof(string), null, MappingType.Element);
			base.Columns.Add(columnDisplay);
			base.Constraints.Add(new UniqueConstraint("Constraint1", new DataColumn[1] { columnValue }, isPrimaryKey: true));
			columnValue.AllowDBNull = false;
			columnValue.Unique = true;
			columnDisplay.AllowDBNull = false;
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public PLU_TaxTypeRow NewPLU_TaxTypeRow()
		{
			return (PLU_TaxTypeRow)NewRow();
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		protected override DataRow NewRowFromBuilder(DataRowBuilder builder)
		{
			return new PLU_TaxTypeRow(builder);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		protected override Type GetRowType()
		{
			return typeof(PLU_TaxTypeRow);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		protected override void OnRowChanged(DataRowChangeEventArgs e)
		{
			base.OnRowChanged(e);
			if (this.PLU_TaxTypeRowChanged != null)
			{
				this.PLU_TaxTypeRowChanged(this, new PLU_TaxTypeRowChangeEvent((PLU_TaxTypeRow)e.Row, e.Action));
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		protected override void OnRowChanging(DataRowChangeEventArgs e)
		{
			base.OnRowChanging(e);
			if (this.PLU_TaxTypeRowChanging != null)
			{
				this.PLU_TaxTypeRowChanging(this, new PLU_TaxTypeRowChangeEvent((PLU_TaxTypeRow)e.Row, e.Action));
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		protected override void OnRowDeleted(DataRowChangeEventArgs e)
		{
			base.OnRowDeleted(e);
			if (this.PLU_TaxTypeRowDeleted != null)
			{
				this.PLU_TaxTypeRowDeleted(this, new PLU_TaxTypeRowChangeEvent((PLU_TaxTypeRow)e.Row, e.Action));
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		protected override void OnRowDeleting(DataRowChangeEventArgs e)
		{
			base.OnRowDeleting(e);
			if (this.PLU_TaxTypeRowDeleting != null)
			{
				this.PLU_TaxTypeRowDeleting(this, new PLU_TaxTypeRowChangeEvent((PLU_TaxTypeRow)e.Row, e.Action));
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public void RemovePLU_TaxTypeRow(PLU_TaxTypeRow row)
		{
			base.Rows.Remove(row);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public static XmlSchemaComplexType GetTypedTableSchema(XmlSchemaSet xs)
		{
			XmlSchemaComplexType xmlSchemaComplexType = new XmlSchemaComplexType();
			XmlSchemaSequence xmlSchemaSequence = new XmlSchemaSequence();
			UIDataSet uIDataSet = new UIDataSet();
			XmlSchemaAny xmlSchemaAny = new XmlSchemaAny();
			xmlSchemaAny.Namespace = "http://www.w3.org/2001/XMLSchema";
			xmlSchemaAny.MinOccurs = 0m;
			xmlSchemaAny.MaxOccurs = decimal.MaxValue;
			xmlSchemaAny.ProcessContents = XmlSchemaContentProcessing.Lax;
			xmlSchemaSequence.Items.Add(xmlSchemaAny);
			XmlSchemaAny xmlSchemaAny2 = new XmlSchemaAny();
			xmlSchemaAny2.Namespace = "urn:schemas-microsoft-com:xml-diffgram-v1";
			xmlSchemaAny2.MinOccurs = 1m;
			xmlSchemaAny2.ProcessContents = XmlSchemaContentProcessing.Lax;
			xmlSchemaSequence.Items.Add(xmlSchemaAny2);
			XmlSchemaAttribute xmlSchemaAttribute = new XmlSchemaAttribute();
			xmlSchemaAttribute.Name = "namespace";
			xmlSchemaAttribute.FixedValue = uIDataSet.Namespace;
			xmlSchemaComplexType.Attributes.Add(xmlSchemaAttribute);
			XmlSchemaAttribute xmlSchemaAttribute2 = new XmlSchemaAttribute();
			xmlSchemaAttribute2.Name = "tableTypeName";
			xmlSchemaAttribute2.FixedValue = "PLU_TaxTypeDataTable";
			xmlSchemaComplexType.Attributes.Add(xmlSchemaAttribute2);
			xmlSchemaComplexType.Particle = xmlSchemaSequence;
			XmlSchema schemaSerializable = uIDataSet.GetSchemaSerializable();
			if (xs.Contains(schemaSerializable.TargetNamespace))
			{
				MemoryStream memoryStream = new MemoryStream();
				MemoryStream memoryStream2 = new MemoryStream();
				try
				{
					XmlSchema xmlSchema = null;
					schemaSerializable.Write(memoryStream);
					IEnumerator enumerator = xs.Schemas(schemaSerializable.TargetNamespace).GetEnumerator();
					while (enumerator.MoveNext())
					{
						xmlSchema = (XmlSchema)enumerator.Current;
						memoryStream2.SetLength(0L);
						xmlSchema.Write(memoryStream2);
						if (memoryStream.Length == memoryStream2.Length)
						{
							memoryStream.Position = 0L;
							memoryStream2.Position = 0L;
							while (memoryStream.Position != memoryStream.Length && memoryStream.ReadByte() == memoryStream2.ReadByte())
							{
							}
							if (memoryStream.Position == memoryStream.Length)
							{
								return xmlSchemaComplexType;
							}
						}
					}
				}
				finally
				{
					memoryStream?.Close();
					memoryStream2?.Close();
				}
			}
			xs.Add(schemaSerializable);
			return xmlSchemaComplexType;
		}
	}

	[Serializable]
	[XmlSchemaProvider("GetTypedTableSchema")]
	public class Report_ColDataTable : DataTable, IEnumerable
	{
		private DataColumn columnField;

		private DataColumn columnDisplay;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public DataColumn FieldColumn => columnField;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public DataColumn DisplayColumn => columnDisplay;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		[Browsable(false)]
		public int Count => base.Rows.Count;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public Report_ColRow this[int index] => (Report_ColRow)base.Rows[index];

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public event Report_ColRowChangeEventHandler Report_ColRowChanging;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public event Report_ColRowChangeEventHandler Report_ColRowChanged;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public event Report_ColRowChangeEventHandler Report_ColRowDeleting;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public event Report_ColRowChangeEventHandler Report_ColRowDeleted;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public Report_ColDataTable()
		{
			base.TableName = "Report_Col";
			BeginInit();
			InitClass();
			EndInit();
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		internal Report_ColDataTable(DataTable table)
		{
			base.TableName = table.TableName;
			if (table.CaseSensitive != table.DataSet.CaseSensitive)
			{
				base.CaseSensitive = table.CaseSensitive;
			}
			if (table.Locale.ToString() != table.DataSet.Locale.ToString())
			{
				base.Locale = table.Locale;
			}
			if (table.Namespace != table.DataSet.Namespace)
			{
				base.Namespace = table.Namespace;
			}
			base.Prefix = table.Prefix;
			base.MinimumCapacity = table.MinimumCapacity;
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		protected Report_ColDataTable(SerializationInfo info, StreamingContext context)
			: base(info, context)
		{
			InitVars();
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public void AddReport_ColRow(Report_ColRow row)
		{
			base.Rows.Add(row);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public Report_ColRow AddReport_ColRow(string Field, string Display)
		{
			Report_ColRow report_ColRow = (Report_ColRow)NewRow();
			object[] itemArray = new object[2] { Field, Display };
			report_ColRow.ItemArray = itemArray;
			base.Rows.Add(report_ColRow);
			return report_ColRow;
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public Report_ColRow FindByField(string Field)
		{
			return (Report_ColRow)base.Rows.Find(new object[1] { Field });
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public virtual IEnumerator GetEnumerator()
		{
			return base.Rows.GetEnumerator();
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public override DataTable Clone()
		{
			Report_ColDataTable report_ColDataTable = (Report_ColDataTable)base.Clone();
			report_ColDataTable.InitVars();
			return report_ColDataTable;
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		protected override DataTable CreateInstance()
		{
			return new Report_ColDataTable();
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		internal void InitVars()
		{
			columnField = base.Columns["Field"];
			columnDisplay = base.Columns["Display"];
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		private void InitClass()
		{
			columnField = new DataColumn("Field", typeof(string), null, MappingType.Element);
			base.Columns.Add(columnField);
			columnDisplay = new DataColumn("Display", typeof(string), null, MappingType.Element);
			base.Columns.Add(columnDisplay);
			base.Constraints.Add(new UniqueConstraint("Constraint1", new DataColumn[1] { columnField }, isPrimaryKey: true));
			columnField.AllowDBNull = false;
			columnField.Unique = true;
			columnDisplay.AllowDBNull = false;
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public Report_ColRow NewReport_ColRow()
		{
			return (Report_ColRow)NewRow();
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		protected override DataRow NewRowFromBuilder(DataRowBuilder builder)
		{
			return new Report_ColRow(builder);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		protected override Type GetRowType()
		{
			return typeof(Report_ColRow);
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		protected override void OnRowChanged(DataRowChangeEventArgs e)
		{
			base.OnRowChanged(e);
			if (this.Report_ColRowChanged != null)
			{
				this.Report_ColRowChanged(this, new Report_ColRowChangeEvent((Report_ColRow)e.Row, e.Action));
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		protected override void OnRowChanging(DataRowChangeEventArgs e)
		{
			base.OnRowChanging(e);
			if (this.Report_ColRowChanging != null)
			{
				this.Report_ColRowChanging(this, new Report_ColRowChangeEvent((Report_ColRow)e.Row, e.Action));
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		protected override void OnRowDeleted(DataRowChangeEventArgs e)
		{
			base.OnRowDeleted(e);
			if (this.Report_ColRowDeleted != null)
			{
				this.Report_ColRowDeleted(this, new Report_ColRowChangeEvent((Report_ColRow)e.Row, e.Action));
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		protected override void OnRowDeleting(DataRowChangeEventArgs e)
		{
			base.OnRowDeleting(e);
			if (this.Report_ColRowDeleting != null)
			{
				this.Report_ColRowDeleting(this, new Report_ColRowChangeEvent((Report_ColRow)e.Row, e.Action));
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public void RemoveReport_ColRow(Report_ColRow row)
		{
			base.Rows.Remove(row);
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public static XmlSchemaComplexType GetTypedTableSchema(XmlSchemaSet xs)
		{
			XmlSchemaComplexType xmlSchemaComplexType = new XmlSchemaComplexType();
			XmlSchemaSequence xmlSchemaSequence = new XmlSchemaSequence();
			UIDataSet uIDataSet = new UIDataSet();
			XmlSchemaAny xmlSchemaAny = new XmlSchemaAny();
			xmlSchemaAny.Namespace = "http://www.w3.org/2001/XMLSchema";
			xmlSchemaAny.MinOccurs = 0m;
			xmlSchemaAny.MaxOccurs = decimal.MaxValue;
			xmlSchemaAny.ProcessContents = XmlSchemaContentProcessing.Lax;
			xmlSchemaSequence.Items.Add(xmlSchemaAny);
			XmlSchemaAny xmlSchemaAny2 = new XmlSchemaAny();
			xmlSchemaAny2.Namespace = "urn:schemas-microsoft-com:xml-diffgram-v1";
			xmlSchemaAny2.MinOccurs = 1m;
			xmlSchemaAny2.ProcessContents = XmlSchemaContentProcessing.Lax;
			xmlSchemaSequence.Items.Add(xmlSchemaAny2);
			XmlSchemaAttribute xmlSchemaAttribute = new XmlSchemaAttribute();
			xmlSchemaAttribute.Name = "namespace";
			xmlSchemaAttribute.FixedValue = uIDataSet.Namespace;
			xmlSchemaComplexType.Attributes.Add(xmlSchemaAttribute);
			XmlSchemaAttribute xmlSchemaAttribute2 = new XmlSchemaAttribute();
			xmlSchemaAttribute2.Name = "tableTypeName";
			xmlSchemaAttribute2.FixedValue = "Report_ColDataTable";
			xmlSchemaComplexType.Attributes.Add(xmlSchemaAttribute2);
			xmlSchemaComplexType.Particle = xmlSchemaSequence;
			XmlSchema schemaSerializable = uIDataSet.GetSchemaSerializable();
			if (xs.Contains(schemaSerializable.TargetNamespace))
			{
				MemoryStream memoryStream = new MemoryStream();
				MemoryStream memoryStream2 = new MemoryStream();
				try
				{
					XmlSchema xmlSchema = null;
					schemaSerializable.Write(memoryStream);
					IEnumerator enumerator = xs.Schemas(schemaSerializable.TargetNamespace).GetEnumerator();
					while (enumerator.MoveNext())
					{
						xmlSchema = (XmlSchema)enumerator.Current;
						memoryStream2.SetLength(0L);
						xmlSchema.Write(memoryStream2);
						if (memoryStream.Length == memoryStream2.Length)
						{
							memoryStream.Position = 0L;
							memoryStream2.Position = 0L;
							while (memoryStream.Position != memoryStream.Length && memoryStream.ReadByte() == memoryStream2.ReadByte())
							{
							}
							if (memoryStream.Position == memoryStream.Length)
							{
								return xmlSchemaComplexType;
							}
						}
					}
				}
				finally
				{
					memoryStream?.Close();
					memoryStream2?.Close();
				}
			}
			xs.Add(schemaSerializable);
			return xmlSchemaComplexType;
		}
	}

	[Serializable]
	[XmlSchemaProvider("GetTypedTableSchema")]
	public class Network_TaskDataTable : DataTable, IEnumerable
	{
		private DataColumn columnValue;

		private DataColumn columnDisplay;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public DataColumn ValueColumn => columnValue;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public DataColumn DisplayColumn => columnDisplay;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[Browsable(false)]
		public int Count => base.Rows.Count;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public Network_TaskRow this[int index] => (Network_TaskRow)base.Rows[index];

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public event Network_TaskRowChangeEventHandler Network_TaskRowChanging;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public event Network_TaskRowChangeEventHandler Network_TaskRowChanged;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public event Network_TaskRowChangeEventHandler Network_TaskRowDeleting;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public event Network_TaskRowChangeEventHandler Network_TaskRowDeleted;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public Network_TaskDataTable()
		{
			base.TableName = "Network_Task";
			BeginInit();
			InitClass();
			EndInit();
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		internal Network_TaskDataTable(DataTable table)
		{
			base.TableName = table.TableName;
			if (table.CaseSensitive != table.DataSet.CaseSensitive)
			{
				base.CaseSensitive = table.CaseSensitive;
			}
			if (table.Locale.ToString() != table.DataSet.Locale.ToString())
			{
				base.Locale = table.Locale;
			}
			if (table.Namespace != table.DataSet.Namespace)
			{
				base.Namespace = table.Namespace;
			}
			base.Prefix = table.Prefix;
			base.MinimumCapacity = table.MinimumCapacity;
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		protected Network_TaskDataTable(SerializationInfo info, StreamingContext context)
			: base(info, context)
		{
			InitVars();
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public void AddNetwork_TaskRow(Network_TaskRow row)
		{
			base.Rows.Add(row);
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public Network_TaskRow AddNetwork_TaskRow(int Value, string Display)
		{
			Network_TaskRow network_TaskRow = (Network_TaskRow)NewRow();
			object[] itemArray = new object[2] { Value, Display };
			network_TaskRow.ItemArray = itemArray;
			base.Rows.Add(network_TaskRow);
			return network_TaskRow;
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public Network_TaskRow FindByValue(int Value)
		{
			return (Network_TaskRow)base.Rows.Find(new object[1] { Value });
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public virtual IEnumerator GetEnumerator()
		{
			return base.Rows.GetEnumerator();
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public override DataTable Clone()
		{
			Network_TaskDataTable network_TaskDataTable = (Network_TaskDataTable)base.Clone();
			network_TaskDataTable.InitVars();
			return network_TaskDataTable;
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		protected override DataTable CreateInstance()
		{
			return new Network_TaskDataTable();
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		internal void InitVars()
		{
			columnValue = base.Columns["Value"];
			columnDisplay = base.Columns["Display"];
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		private void InitClass()
		{
			columnValue = new DataColumn("Value", typeof(int), null, MappingType.Element);
			base.Columns.Add(columnValue);
			columnDisplay = new DataColumn("Display", typeof(string), null, MappingType.Element);
			base.Columns.Add(columnDisplay);
			base.Constraints.Add(new UniqueConstraint("Constraint1", new DataColumn[1] { columnValue }, isPrimaryKey: true));
			columnValue.AllowDBNull = false;
			columnValue.Unique = true;
			columnDisplay.AllowDBNull = false;
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public Network_TaskRow NewNetwork_TaskRow()
		{
			return (Network_TaskRow)NewRow();
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		protected override DataRow NewRowFromBuilder(DataRowBuilder builder)
		{
			return new Network_TaskRow(builder);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		protected override Type GetRowType()
		{
			return typeof(Network_TaskRow);
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		protected override void OnRowChanged(DataRowChangeEventArgs e)
		{
			base.OnRowChanged(e);
			if (this.Network_TaskRowChanged != null)
			{
				this.Network_TaskRowChanged(this, new Network_TaskRowChangeEvent((Network_TaskRow)e.Row, e.Action));
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		protected override void OnRowChanging(DataRowChangeEventArgs e)
		{
			base.OnRowChanging(e);
			if (this.Network_TaskRowChanging != null)
			{
				this.Network_TaskRowChanging(this, new Network_TaskRowChangeEvent((Network_TaskRow)e.Row, e.Action));
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		protected override void OnRowDeleted(DataRowChangeEventArgs e)
		{
			base.OnRowDeleted(e);
			if (this.Network_TaskRowDeleted != null)
			{
				this.Network_TaskRowDeleted(this, new Network_TaskRowChangeEvent((Network_TaskRow)e.Row, e.Action));
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		protected override void OnRowDeleting(DataRowChangeEventArgs e)
		{
			base.OnRowDeleting(e);
			if (this.Network_TaskRowDeleting != null)
			{
				this.Network_TaskRowDeleting(this, new Network_TaskRowChangeEvent((Network_TaskRow)e.Row, e.Action));
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public void RemoveNetwork_TaskRow(Network_TaskRow row)
		{
			base.Rows.Remove(row);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public static XmlSchemaComplexType GetTypedTableSchema(XmlSchemaSet xs)
		{
			XmlSchemaComplexType xmlSchemaComplexType = new XmlSchemaComplexType();
			XmlSchemaSequence xmlSchemaSequence = new XmlSchemaSequence();
			UIDataSet uIDataSet = new UIDataSet();
			XmlSchemaAny xmlSchemaAny = new XmlSchemaAny();
			xmlSchemaAny.Namespace = "http://www.w3.org/2001/XMLSchema";
			xmlSchemaAny.MinOccurs = 0m;
			xmlSchemaAny.MaxOccurs = decimal.MaxValue;
			xmlSchemaAny.ProcessContents = XmlSchemaContentProcessing.Lax;
			xmlSchemaSequence.Items.Add(xmlSchemaAny);
			XmlSchemaAny xmlSchemaAny2 = new XmlSchemaAny();
			xmlSchemaAny2.Namespace = "urn:schemas-microsoft-com:xml-diffgram-v1";
			xmlSchemaAny2.MinOccurs = 1m;
			xmlSchemaAny2.ProcessContents = XmlSchemaContentProcessing.Lax;
			xmlSchemaSequence.Items.Add(xmlSchemaAny2);
			XmlSchemaAttribute xmlSchemaAttribute = new XmlSchemaAttribute();
			xmlSchemaAttribute.Name = "namespace";
			xmlSchemaAttribute.FixedValue = uIDataSet.Namespace;
			xmlSchemaComplexType.Attributes.Add(xmlSchemaAttribute);
			XmlSchemaAttribute xmlSchemaAttribute2 = new XmlSchemaAttribute();
			xmlSchemaAttribute2.Name = "tableTypeName";
			xmlSchemaAttribute2.FixedValue = "Network_TaskDataTable";
			xmlSchemaComplexType.Attributes.Add(xmlSchemaAttribute2);
			xmlSchemaComplexType.Particle = xmlSchemaSequence;
			XmlSchema schemaSerializable = uIDataSet.GetSchemaSerializable();
			if (xs.Contains(schemaSerializable.TargetNamespace))
			{
				MemoryStream memoryStream = new MemoryStream();
				MemoryStream memoryStream2 = new MemoryStream();
				try
				{
					XmlSchema xmlSchema = null;
					schemaSerializable.Write(memoryStream);
					IEnumerator enumerator = xs.Schemas(schemaSerializable.TargetNamespace).GetEnumerator();
					while (enumerator.MoveNext())
					{
						xmlSchema = (XmlSchema)enumerator.Current;
						memoryStream2.SetLength(0L);
						xmlSchema.Write(memoryStream2);
						if (memoryStream.Length == memoryStream2.Length)
						{
							memoryStream.Position = 0L;
							memoryStream2.Position = 0L;
							while (memoryStream.Position != memoryStream.Length && memoryStream.ReadByte() == memoryStream2.ReadByte())
							{
							}
							if (memoryStream.Position == memoryStream.Length)
							{
								return xmlSchemaComplexType;
							}
						}
					}
				}
				finally
				{
					memoryStream?.Close();
					memoryStream2?.Close();
				}
			}
			xs.Add(schemaSerializable);
			return xmlSchemaComplexType;
		}
	}

	[Serializable]
	[XmlSchemaProvider("GetTypedTableSchema")]
	public class Network_DueDataTable : DataTable, IEnumerable
	{
		private DataColumn columnValue;

		private DataColumn columnDisplay;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public DataColumn ValueColumn => columnValue;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public DataColumn DisplayColumn => columnDisplay;

		[Browsable(false)]
		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public int Count => base.Rows.Count;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public Network_DueRow this[int index] => (Network_DueRow)base.Rows[index];

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public event Network_DueRowChangeEventHandler Network_DueRowChanging;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public event Network_DueRowChangeEventHandler Network_DueRowChanged;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public event Network_DueRowChangeEventHandler Network_DueRowDeleting;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public event Network_DueRowChangeEventHandler Network_DueRowDeleted;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public Network_DueDataTable()
		{
			base.TableName = "Network_Due";
			BeginInit();
			InitClass();
			EndInit();
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		internal Network_DueDataTable(DataTable table)
		{
			base.TableName = table.TableName;
			if (table.CaseSensitive != table.DataSet.CaseSensitive)
			{
				base.CaseSensitive = table.CaseSensitive;
			}
			if (table.Locale.ToString() != table.DataSet.Locale.ToString())
			{
				base.Locale = table.Locale;
			}
			if (table.Namespace != table.DataSet.Namespace)
			{
				base.Namespace = table.Namespace;
			}
			base.Prefix = table.Prefix;
			base.MinimumCapacity = table.MinimumCapacity;
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		protected Network_DueDataTable(SerializationInfo info, StreamingContext context)
			: base(info, context)
		{
			InitVars();
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public void AddNetwork_DueRow(Network_DueRow row)
		{
			base.Rows.Add(row);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public Network_DueRow AddNetwork_DueRow(int Value, string Display)
		{
			Network_DueRow network_DueRow = (Network_DueRow)NewRow();
			object[] itemArray = new object[2] { Value, Display };
			network_DueRow.ItemArray = itemArray;
			base.Rows.Add(network_DueRow);
			return network_DueRow;
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public Network_DueRow FindByValue(int Value)
		{
			return (Network_DueRow)base.Rows.Find(new object[1] { Value });
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public virtual IEnumerator GetEnumerator()
		{
			return base.Rows.GetEnumerator();
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public override DataTable Clone()
		{
			Network_DueDataTable network_DueDataTable = (Network_DueDataTable)base.Clone();
			network_DueDataTable.InitVars();
			return network_DueDataTable;
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		protected override DataTable CreateInstance()
		{
			return new Network_DueDataTable();
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		internal void InitVars()
		{
			columnValue = base.Columns["Value"];
			columnDisplay = base.Columns["Display"];
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		private void InitClass()
		{
			columnValue = new DataColumn("Value", typeof(int), null, MappingType.Element);
			base.Columns.Add(columnValue);
			columnDisplay = new DataColumn("Display", typeof(string), null, MappingType.Element);
			base.Columns.Add(columnDisplay);
			base.Constraints.Add(new UniqueConstraint("Constraint1", new DataColumn[1] { columnValue }, isPrimaryKey: true));
			columnValue.AllowDBNull = false;
			columnValue.Unique = true;
			columnDisplay.AllowDBNull = false;
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public Network_DueRow NewNetwork_DueRow()
		{
			return (Network_DueRow)NewRow();
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		protected override DataRow NewRowFromBuilder(DataRowBuilder builder)
		{
			return new Network_DueRow(builder);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		protected override Type GetRowType()
		{
			return typeof(Network_DueRow);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		protected override void OnRowChanged(DataRowChangeEventArgs e)
		{
			base.OnRowChanged(e);
			if (this.Network_DueRowChanged != null)
			{
				this.Network_DueRowChanged(this, new Network_DueRowChangeEvent((Network_DueRow)e.Row, e.Action));
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		protected override void OnRowChanging(DataRowChangeEventArgs e)
		{
			base.OnRowChanging(e);
			if (this.Network_DueRowChanging != null)
			{
				this.Network_DueRowChanging(this, new Network_DueRowChangeEvent((Network_DueRow)e.Row, e.Action));
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		protected override void OnRowDeleted(DataRowChangeEventArgs e)
		{
			base.OnRowDeleted(e);
			if (this.Network_DueRowDeleted != null)
			{
				this.Network_DueRowDeleted(this, new Network_DueRowChangeEvent((Network_DueRow)e.Row, e.Action));
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		protected override void OnRowDeleting(DataRowChangeEventArgs e)
		{
			base.OnRowDeleting(e);
			if (this.Network_DueRowDeleting != null)
			{
				this.Network_DueRowDeleting(this, new Network_DueRowChangeEvent((Network_DueRow)e.Row, e.Action));
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public void RemoveNetwork_DueRow(Network_DueRow row)
		{
			base.Rows.Remove(row);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public static XmlSchemaComplexType GetTypedTableSchema(XmlSchemaSet xs)
		{
			XmlSchemaComplexType xmlSchemaComplexType = new XmlSchemaComplexType();
			XmlSchemaSequence xmlSchemaSequence = new XmlSchemaSequence();
			UIDataSet uIDataSet = new UIDataSet();
			XmlSchemaAny xmlSchemaAny = new XmlSchemaAny();
			xmlSchemaAny.Namespace = "http://www.w3.org/2001/XMLSchema";
			xmlSchemaAny.MinOccurs = 0m;
			xmlSchemaAny.MaxOccurs = decimal.MaxValue;
			xmlSchemaAny.ProcessContents = XmlSchemaContentProcessing.Lax;
			xmlSchemaSequence.Items.Add(xmlSchemaAny);
			XmlSchemaAny xmlSchemaAny2 = new XmlSchemaAny();
			xmlSchemaAny2.Namespace = "urn:schemas-microsoft-com:xml-diffgram-v1";
			xmlSchemaAny2.MinOccurs = 1m;
			xmlSchemaAny2.ProcessContents = XmlSchemaContentProcessing.Lax;
			xmlSchemaSequence.Items.Add(xmlSchemaAny2);
			XmlSchemaAttribute xmlSchemaAttribute = new XmlSchemaAttribute();
			xmlSchemaAttribute.Name = "namespace";
			xmlSchemaAttribute.FixedValue = uIDataSet.Namespace;
			xmlSchemaComplexType.Attributes.Add(xmlSchemaAttribute);
			XmlSchemaAttribute xmlSchemaAttribute2 = new XmlSchemaAttribute();
			xmlSchemaAttribute2.Name = "tableTypeName";
			xmlSchemaAttribute2.FixedValue = "Network_DueDataTable";
			xmlSchemaComplexType.Attributes.Add(xmlSchemaAttribute2);
			xmlSchemaComplexType.Particle = xmlSchemaSequence;
			XmlSchema schemaSerializable = uIDataSet.GetSchemaSerializable();
			if (xs.Contains(schemaSerializable.TargetNamespace))
			{
				MemoryStream memoryStream = new MemoryStream();
				MemoryStream memoryStream2 = new MemoryStream();
				try
				{
					XmlSchema xmlSchema = null;
					schemaSerializable.Write(memoryStream);
					IEnumerator enumerator = xs.Schemas(schemaSerializable.TargetNamespace).GetEnumerator();
					while (enumerator.MoveNext())
					{
						xmlSchema = (XmlSchema)enumerator.Current;
						memoryStream2.SetLength(0L);
						xmlSchema.Write(memoryStream2);
						if (memoryStream.Length == memoryStream2.Length)
						{
							memoryStream.Position = 0L;
							memoryStream2.Position = 0L;
							while (memoryStream.Position != memoryStream.Length && memoryStream.ReadByte() == memoryStream2.ReadByte())
							{
							}
							if (memoryStream.Position == memoryStream.Length)
							{
								return xmlSchemaComplexType;
							}
						}
					}
				}
				finally
				{
					memoryStream?.Close();
					memoryStream2?.Close();
				}
			}
			xs.Add(schemaSerializable);
			return xmlSchemaComplexType;
		}
	}

	[Serializable]
	[XmlSchemaProvider("GetTypedTableSchema")]
	public class Network_AutoDataTable : DataTable, IEnumerable
	{
		private DataColumn columnID;

		private DataColumn columnTask;

		private DataColumn columnDue;

		private DataColumn columnDateTime;

		private DataColumn columnRepeat;

		private DataColumn columnDay;

		private DataColumn columnHour;

		private DataColumn columnMinute;

		private DataColumn columnSecond;

		private DataColumn columnUri;

		private DataColumn columnFile;

		private DataColumn columnLogin;

		private DataColumn columnUser;

		private DataColumn columnPassword;

		private static DateTime columnDateTime_defaultValue = DateTime.Parse("2000-01-01T00:00:00");

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public DataColumn IDColumn => columnID;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public DataColumn TaskColumn => columnTask;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public DataColumn DueColumn => columnDue;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public DataColumn DateTimeColumn => columnDateTime;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public DataColumn RepeatColumn => columnRepeat;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public DataColumn DayColumn => columnDay;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public DataColumn HourColumn => columnHour;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public DataColumn MinuteColumn => columnMinute;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public DataColumn SecondColumn => columnSecond;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public DataColumn UriColumn => columnUri;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public DataColumn FileColumn => columnFile;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public DataColumn LoginColumn => columnLogin;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public DataColumn UserColumn => columnUser;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public DataColumn PasswordColumn => columnPassword;

		[DebuggerNonUserCode]
		[Browsable(false)]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public int Count => base.Rows.Count;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public Network_AutoRow this[int index] => (Network_AutoRow)base.Rows[index];

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public event Network_AutoRowChangeEventHandler Network_AutoRowChanging;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public event Network_AutoRowChangeEventHandler Network_AutoRowChanged;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public event Network_AutoRowChangeEventHandler Network_AutoRowDeleting;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public event Network_AutoRowChangeEventHandler Network_AutoRowDeleted;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public Network_AutoDataTable()
		{
			base.TableName = "Network_Auto";
			BeginInit();
			InitClass();
			EndInit();
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		internal Network_AutoDataTable(DataTable table)
		{
			base.TableName = table.TableName;
			if (table.CaseSensitive != table.DataSet.CaseSensitive)
			{
				base.CaseSensitive = table.CaseSensitive;
			}
			if (table.Locale.ToString() != table.DataSet.Locale.ToString())
			{
				base.Locale = table.Locale;
			}
			if (table.Namespace != table.DataSet.Namespace)
			{
				base.Namespace = table.Namespace;
			}
			base.Prefix = table.Prefix;
			base.MinimumCapacity = table.MinimumCapacity;
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		protected Network_AutoDataTable(SerializationInfo info, StreamingContext context)
			: base(info, context)
		{
			InitVars();
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public void AddNetwork_AutoRow(Network_AutoRow row)
		{
			base.Rows.Add(row);
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public Network_AutoRow AddNetwork_AutoRow(int Task, int Due, DateTime DateTime, bool Repeat, int Day, int Hour, int Minute, int Second, string Uri, string File, bool Login, string User, string Password)
		{
			Network_AutoRow network_AutoRow = (Network_AutoRow)NewRow();
			object[] itemArray = new object[14]
			{
				null, Task, Due, DateTime, Repeat, Day, Hour, Minute, Second, Uri,
				File, Login, User, Password
			};
			network_AutoRow.ItemArray = itemArray;
			base.Rows.Add(network_AutoRow);
			return network_AutoRow;
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public Network_AutoRow FindByID(int ID)
		{
			return (Network_AutoRow)base.Rows.Find(new object[1] { ID });
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public virtual IEnumerator GetEnumerator()
		{
			return base.Rows.GetEnumerator();
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public override DataTable Clone()
		{
			Network_AutoDataTable network_AutoDataTable = (Network_AutoDataTable)base.Clone();
			network_AutoDataTable.InitVars();
			return network_AutoDataTable;
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		protected override DataTable CreateInstance()
		{
			return new Network_AutoDataTable();
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		internal void InitVars()
		{
			columnID = base.Columns["ID"];
			columnTask = base.Columns["Task"];
			columnDue = base.Columns["Due"];
			columnDateTime = base.Columns["DateTime"];
			columnRepeat = base.Columns["Repeat"];
			columnDay = base.Columns["Day"];
			columnHour = base.Columns["Hour"];
			columnMinute = base.Columns["Minute"];
			columnSecond = base.Columns["Second"];
			columnUri = base.Columns["Uri"];
			columnFile = base.Columns["File"];
			columnLogin = base.Columns["Login"];
			columnUser = base.Columns["User"];
			columnPassword = base.Columns["Password"];
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		private void InitClass()
		{
			columnID = new DataColumn("ID", typeof(int), null, MappingType.Element);
			base.Columns.Add(columnID);
			columnTask = new DataColumn("Task", typeof(int), null, MappingType.Element);
			base.Columns.Add(columnTask);
			columnDue = new DataColumn("Due", typeof(int), null, MappingType.Element);
			base.Columns.Add(columnDue);
			columnDateTime = new DataColumn("DateTime", typeof(DateTime), null, MappingType.Element);
			base.Columns.Add(columnDateTime);
			columnRepeat = new DataColumn("Repeat", typeof(bool), null, MappingType.Element);
			base.Columns.Add(columnRepeat);
			columnDay = new DataColumn("Day", typeof(int), null, MappingType.Element);
			base.Columns.Add(columnDay);
			columnHour = new DataColumn("Hour", typeof(int), null, MappingType.Element);
			base.Columns.Add(columnHour);
			columnMinute = new DataColumn("Minute", typeof(int), null, MappingType.Element);
			base.Columns.Add(columnMinute);
			columnSecond = new DataColumn("Second", typeof(int), null, MappingType.Element);
			base.Columns.Add(columnSecond);
			columnUri = new DataColumn("Uri", typeof(string), null, MappingType.Element);
			base.Columns.Add(columnUri);
			columnFile = new DataColumn("File", typeof(string), null, MappingType.Element);
			base.Columns.Add(columnFile);
			columnLogin = new DataColumn("Login", typeof(bool), null, MappingType.Element);
			base.Columns.Add(columnLogin);
			columnUser = new DataColumn("User", typeof(string), null, MappingType.Element);
			base.Columns.Add(columnUser);
			columnPassword = new DataColumn("Password", typeof(string), null, MappingType.Element);
			base.Columns.Add(columnPassword);
			base.Constraints.Add(new UniqueConstraint("Constraint1", new DataColumn[1] { columnID }, isPrimaryKey: true));
			columnID.AutoIncrement = true;
			columnID.AllowDBNull = false;
			columnID.Unique = true;
			columnTask.AllowDBNull = false;
			columnTask.DefaultValue = 7;
			columnDue.AllowDBNull = false;
			columnDue.DefaultValue = 0;
			columnDateTime.AllowDBNull = false;
			columnDateTime.DefaultValue = columnDateTime_defaultValue;
			columnRepeat.AllowDBNull = false;
			columnRepeat.DefaultValue = true;
			columnDay.AllowDBNull = false;
			columnDay.DefaultValue = 0;
			columnHour.AllowDBNull = false;
			columnHour.DefaultValue = 1;
			columnMinute.AllowDBNull = false;
			columnMinute.DefaultValue = 0;
			columnSecond.AllowDBNull = false;
			columnSecond.DefaultValue = 0;
			columnUri.AllowDBNull = false;
			columnUri.DefaultValue = "ftp://";
			columnFile.AllowDBNull = false;
			columnFile.DefaultValue = "ECS.mdb";
			columnLogin.DefaultValue = false;
			columnUser.AllowDBNull = false;
			columnUser.DefaultValue = "";
			columnPassword.AllowDBNull = false;
			columnPassword.DefaultValue = "";
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public Network_AutoRow NewNetwork_AutoRow()
		{
			return (Network_AutoRow)NewRow();
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		protected override DataRow NewRowFromBuilder(DataRowBuilder builder)
		{
			return new Network_AutoRow(builder);
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		protected override Type GetRowType()
		{
			return typeof(Network_AutoRow);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		protected override void OnRowChanged(DataRowChangeEventArgs e)
		{
			base.OnRowChanged(e);
			if (this.Network_AutoRowChanged != null)
			{
				this.Network_AutoRowChanged(this, new Network_AutoRowChangeEvent((Network_AutoRow)e.Row, e.Action));
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		protected override void OnRowChanging(DataRowChangeEventArgs e)
		{
			base.OnRowChanging(e);
			if (this.Network_AutoRowChanging != null)
			{
				this.Network_AutoRowChanging(this, new Network_AutoRowChangeEvent((Network_AutoRow)e.Row, e.Action));
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		protected override void OnRowDeleted(DataRowChangeEventArgs e)
		{
			base.OnRowDeleted(e);
			if (this.Network_AutoRowDeleted != null)
			{
				this.Network_AutoRowDeleted(this, new Network_AutoRowChangeEvent((Network_AutoRow)e.Row, e.Action));
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		protected override void OnRowDeleting(DataRowChangeEventArgs e)
		{
			base.OnRowDeleting(e);
			if (this.Network_AutoRowDeleting != null)
			{
				this.Network_AutoRowDeleting(this, new Network_AutoRowChangeEvent((Network_AutoRow)e.Row, e.Action));
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public void RemoveNetwork_AutoRow(Network_AutoRow row)
		{
			base.Rows.Remove(row);
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public static XmlSchemaComplexType GetTypedTableSchema(XmlSchemaSet xs)
		{
			XmlSchemaComplexType xmlSchemaComplexType = new XmlSchemaComplexType();
			XmlSchemaSequence xmlSchemaSequence = new XmlSchemaSequence();
			UIDataSet uIDataSet = new UIDataSet();
			XmlSchemaAny xmlSchemaAny = new XmlSchemaAny();
			xmlSchemaAny.Namespace = "http://www.w3.org/2001/XMLSchema";
			xmlSchemaAny.MinOccurs = 0m;
			xmlSchemaAny.MaxOccurs = decimal.MaxValue;
			xmlSchemaAny.ProcessContents = XmlSchemaContentProcessing.Lax;
			xmlSchemaSequence.Items.Add(xmlSchemaAny);
			XmlSchemaAny xmlSchemaAny2 = new XmlSchemaAny();
			xmlSchemaAny2.Namespace = "urn:schemas-microsoft-com:xml-diffgram-v1";
			xmlSchemaAny2.MinOccurs = 1m;
			xmlSchemaAny2.ProcessContents = XmlSchemaContentProcessing.Lax;
			xmlSchemaSequence.Items.Add(xmlSchemaAny2);
			XmlSchemaAttribute xmlSchemaAttribute = new XmlSchemaAttribute();
			xmlSchemaAttribute.Name = "namespace";
			xmlSchemaAttribute.FixedValue = uIDataSet.Namespace;
			xmlSchemaComplexType.Attributes.Add(xmlSchemaAttribute);
			XmlSchemaAttribute xmlSchemaAttribute2 = new XmlSchemaAttribute();
			xmlSchemaAttribute2.Name = "tableTypeName";
			xmlSchemaAttribute2.FixedValue = "Network_AutoDataTable";
			xmlSchemaComplexType.Attributes.Add(xmlSchemaAttribute2);
			xmlSchemaComplexType.Particle = xmlSchemaSequence;
			XmlSchema schemaSerializable = uIDataSet.GetSchemaSerializable();
			if (xs.Contains(schemaSerializable.TargetNamespace))
			{
				MemoryStream memoryStream = new MemoryStream();
				MemoryStream memoryStream2 = new MemoryStream();
				try
				{
					XmlSchema xmlSchema = null;
					schemaSerializable.Write(memoryStream);
					IEnumerator enumerator = xs.Schemas(schemaSerializable.TargetNamespace).GetEnumerator();
					while (enumerator.MoveNext())
					{
						xmlSchema = (XmlSchema)enumerator.Current;
						memoryStream2.SetLength(0L);
						xmlSchema.Write(memoryStream2);
						if (memoryStream.Length == memoryStream2.Length)
						{
							memoryStream.Position = 0L;
							memoryStream2.Position = 0L;
							while (memoryStream.Position != memoryStream.Length && memoryStream.ReadByte() == memoryStream2.ReadByte())
							{
							}
							if (memoryStream.Position == memoryStream.Length)
							{
								return xmlSchemaComplexType;
							}
						}
					}
				}
				finally
				{
					memoryStream?.Close();
					memoryStream2?.Close();
				}
			}
			xs.Add(schemaSerializable);
			return xmlSchemaComplexType;
		}
	}

	[Serializable]
	[XmlSchemaProvider("GetTypedTableSchema")]
	public class CustomDataTable : DataTable, IEnumerable
	{
		private DataColumn columnID;

		private DataColumn columnDisplay;

		private DataColumn columnMenu;

		private DataColumn columnKeyword;

		private DataColumn columnTable;

		private DataColumn columnVisible;

		private DataColumn columnImport;

		private DataColumn columnExport;

		private DataColumn columnSsp;

		private DataColumn columnTop;

		private DataColumn columnBottom;

		private DataColumn columnLeft;

		private DataColumn columnWidth1;

		private DataColumn columnWidth2;

		private DataColumn columnWidth3;

		private DataColumn columnWidth4;

		private DataColumn columnWidth5;

		private DataColumn columnWidth6;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public DataColumn IDColumn => columnID;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public DataColumn DisplayColumn => columnDisplay;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public DataColumn MenuColumn => columnMenu;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public DataColumn KeywordColumn => columnKeyword;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public DataColumn TableColumn => columnTable;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public DataColumn VisibleColumn => columnVisible;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public DataColumn ImportColumn => columnImport;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public DataColumn ExportColumn => columnExport;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public DataColumn SspColumn => columnSsp;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public DataColumn TopColumn => columnTop;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public DataColumn BottomColumn => columnBottom;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public DataColumn LeftColumn => columnLeft;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public DataColumn Width1Column => columnWidth1;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public DataColumn Width2Column => columnWidth2;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public DataColumn Width3Column => columnWidth3;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public DataColumn Width4Column => columnWidth4;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public DataColumn Width5Column => columnWidth5;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public DataColumn Width6Column => columnWidth6;

		[Browsable(false)]
		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public int Count => base.Rows.Count;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public CustomRow this[int index] => (CustomRow)base.Rows[index];

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public event CustomRowChangeEventHandler CustomRowChanging;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public event CustomRowChangeEventHandler CustomRowChanged;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public event CustomRowChangeEventHandler CustomRowDeleting;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public event CustomRowChangeEventHandler CustomRowDeleted;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public CustomDataTable()
		{
			base.TableName = "Custom";
			BeginInit();
			InitClass();
			EndInit();
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		internal CustomDataTable(DataTable table)
		{
			base.TableName = table.TableName;
			if (table.CaseSensitive != table.DataSet.CaseSensitive)
			{
				base.CaseSensitive = table.CaseSensitive;
			}
			if (table.Locale.ToString() != table.DataSet.Locale.ToString())
			{
				base.Locale = table.Locale;
			}
			if (table.Namespace != table.DataSet.Namespace)
			{
				base.Namespace = table.Namespace;
			}
			base.Prefix = table.Prefix;
			base.MinimumCapacity = table.MinimumCapacity;
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		protected CustomDataTable(SerializationInfo info, StreamingContext context)
			: base(info, context)
		{
			InitVars();
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public void AddCustomRow(CustomRow row)
		{
			base.Rows.Add(row);
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public CustomRow AddCustomRow(string Display, string Menu, string Keyword, string _Table, bool Visible, bool Import, bool Export, int Ssp, int Top, int Bottom, int Left, int Width1, int Width2, int Width3, int Width4, int Width5, int Width6)
		{
			CustomRow customRow = (CustomRow)NewRow();
			object[] itemArray = new object[18]
			{
				null, Display, Menu, Keyword, _Table, Visible, Import, Export, Ssp, Top,
				Bottom, Left, Width1, Width2, Width3, Width4, Width5, Width6
			};
			customRow.ItemArray = itemArray;
			base.Rows.Add(customRow);
			return customRow;
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public CustomRow FindByID(int ID)
		{
			return (CustomRow)base.Rows.Find(new object[1] { ID });
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public virtual IEnumerator GetEnumerator()
		{
			return base.Rows.GetEnumerator();
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public override DataTable Clone()
		{
			CustomDataTable customDataTable = (CustomDataTable)base.Clone();
			customDataTable.InitVars();
			return customDataTable;
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		protected override DataTable CreateInstance()
		{
			return new CustomDataTable();
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		internal void InitVars()
		{
			columnID = base.Columns["ID"];
			columnDisplay = base.Columns["Display"];
			columnMenu = base.Columns["Menu"];
			columnKeyword = base.Columns["Keyword"];
			columnTable = base.Columns["Table"];
			columnVisible = base.Columns["Visible"];
			columnImport = base.Columns["Import"];
			columnExport = base.Columns["Export"];
			columnSsp = base.Columns["Ssp"];
			columnTop = base.Columns["Top"];
			columnBottom = base.Columns["Bottom"];
			columnLeft = base.Columns["Left"];
			columnWidth1 = base.Columns["Width1"];
			columnWidth2 = base.Columns["Width2"];
			columnWidth3 = base.Columns["Width3"];
			columnWidth4 = base.Columns["Width4"];
			columnWidth5 = base.Columns["Width5"];
			columnWidth6 = base.Columns["Width6"];
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		private void InitClass()
		{
			columnID = new DataColumn("ID", typeof(int), null, MappingType.Element);
			base.Columns.Add(columnID);
			columnDisplay = new DataColumn("Display", typeof(string), null, MappingType.Element);
			base.Columns.Add(columnDisplay);
			columnMenu = new DataColumn("Menu", typeof(string), null, MappingType.Element);
			base.Columns.Add(columnMenu);
			columnKeyword = new DataColumn("Keyword", typeof(string), null, MappingType.Element);
			base.Columns.Add(columnKeyword);
			columnTable = new DataColumn("Table", typeof(string), null, MappingType.Element);
			columnTable.ExtendedProperties.Add("Generator_ColumnPropNameInTable", "TableColumn");
			columnTable.ExtendedProperties.Add("Generator_ColumnVarNameInTable", "columnTable");
			columnTable.ExtendedProperties.Add("Generator_UserColumnName", "Table");
			base.Columns.Add(columnTable);
			columnVisible = new DataColumn("Visible", typeof(bool), null, MappingType.Element);
			base.Columns.Add(columnVisible);
			columnImport = new DataColumn("Import", typeof(bool), null, MappingType.Element);
			base.Columns.Add(columnImport);
			columnExport = new DataColumn("Export", typeof(bool), null, MappingType.Element);
			base.Columns.Add(columnExport);
			columnSsp = new DataColumn("Ssp", typeof(int), null, MappingType.Element);
			base.Columns.Add(columnSsp);
			columnTop = new DataColumn("Top", typeof(int), null, MappingType.Element);
			base.Columns.Add(columnTop);
			columnBottom = new DataColumn("Bottom", typeof(int), null, MappingType.Element);
			base.Columns.Add(columnBottom);
			columnLeft = new DataColumn("Left", typeof(int), null, MappingType.Element);
			base.Columns.Add(columnLeft);
			columnWidth1 = new DataColumn("Width1", typeof(int), null, MappingType.Element);
			base.Columns.Add(columnWidth1);
			columnWidth2 = new DataColumn("Width2", typeof(int), null, MappingType.Element);
			base.Columns.Add(columnWidth2);
			columnWidth3 = new DataColumn("Width3", typeof(int), null, MappingType.Element);
			base.Columns.Add(columnWidth3);
			columnWidth4 = new DataColumn("Width4", typeof(int), null, MappingType.Element);
			base.Columns.Add(columnWidth4);
			columnWidth5 = new DataColumn("Width5", typeof(int), null, MappingType.Element);
			base.Columns.Add(columnWidth5);
			columnWidth6 = new DataColumn("Width6", typeof(int), null, MappingType.Element);
			base.Columns.Add(columnWidth6);
			base.Constraints.Add(new UniqueConstraint("Constraint1", new DataColumn[1] { columnID }, isPrimaryKey: true));
			columnID.AutoIncrement = true;
			columnID.AllowDBNull = false;
			columnID.Unique = true;
			columnDisplay.DefaultValue = "";
			columnMenu.DefaultValue = "";
			columnKeyword.DefaultValue = "ZZZ";
			columnTable.DefaultValue = "Custom1";
			columnVisible.DefaultValue = true;
			columnImport.DefaultValue = true;
			columnExport.DefaultValue = true;
			columnSsp.DefaultValue = 0;
			columnTop.Caption = "Ssp";
			columnTop.DefaultValue = 10;
			columnBottom.Caption = "Ssp";
			columnBottom.DefaultValue = 10;
			columnLeft.Caption = "Ssp";
			columnLeft.DefaultValue = 10;
			columnWidth1.Caption = "Ssp";
			columnWidth1.DefaultValue = 150;
			columnWidth2.Caption = "Ssp";
			columnWidth2.DefaultValue = 150;
			columnWidth3.Caption = "Ssp";
			columnWidth3.DefaultValue = 0;
			columnWidth4.Caption = "Ssp";
			columnWidth4.DefaultValue = 0;
			columnWidth5.Caption = "Ssp";
			columnWidth5.DefaultValue = 0;
			columnWidth6.Caption = "Ssp";
			columnWidth6.DefaultValue = 0;
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public CustomRow NewCustomRow()
		{
			return (CustomRow)NewRow();
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		protected override DataRow NewRowFromBuilder(DataRowBuilder builder)
		{
			return new CustomRow(builder);
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		protected override Type GetRowType()
		{
			return typeof(CustomRow);
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		protected override void OnRowChanged(DataRowChangeEventArgs e)
		{
			base.OnRowChanged(e);
			if (this.CustomRowChanged != null)
			{
				this.CustomRowChanged(this, new CustomRowChangeEvent((CustomRow)e.Row, e.Action));
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		protected override void OnRowChanging(DataRowChangeEventArgs e)
		{
			base.OnRowChanging(e);
			if (this.CustomRowChanging != null)
			{
				this.CustomRowChanging(this, new CustomRowChangeEvent((CustomRow)e.Row, e.Action));
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		protected override void OnRowDeleted(DataRowChangeEventArgs e)
		{
			base.OnRowDeleted(e);
			if (this.CustomRowDeleted != null)
			{
				this.CustomRowDeleted(this, new CustomRowChangeEvent((CustomRow)e.Row, e.Action));
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		protected override void OnRowDeleting(DataRowChangeEventArgs e)
		{
			base.OnRowDeleting(e);
			if (this.CustomRowDeleting != null)
			{
				this.CustomRowDeleting(this, new CustomRowChangeEvent((CustomRow)e.Row, e.Action));
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public void RemoveCustomRow(CustomRow row)
		{
			base.Rows.Remove(row);
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public static XmlSchemaComplexType GetTypedTableSchema(XmlSchemaSet xs)
		{
			XmlSchemaComplexType xmlSchemaComplexType = new XmlSchemaComplexType();
			XmlSchemaSequence xmlSchemaSequence = new XmlSchemaSequence();
			UIDataSet uIDataSet = new UIDataSet();
			XmlSchemaAny xmlSchemaAny = new XmlSchemaAny();
			xmlSchemaAny.Namespace = "http://www.w3.org/2001/XMLSchema";
			xmlSchemaAny.MinOccurs = 0m;
			xmlSchemaAny.MaxOccurs = decimal.MaxValue;
			xmlSchemaAny.ProcessContents = XmlSchemaContentProcessing.Lax;
			xmlSchemaSequence.Items.Add(xmlSchemaAny);
			XmlSchemaAny xmlSchemaAny2 = new XmlSchemaAny();
			xmlSchemaAny2.Namespace = "urn:schemas-microsoft-com:xml-diffgram-v1";
			xmlSchemaAny2.MinOccurs = 1m;
			xmlSchemaAny2.ProcessContents = XmlSchemaContentProcessing.Lax;
			xmlSchemaSequence.Items.Add(xmlSchemaAny2);
			XmlSchemaAttribute xmlSchemaAttribute = new XmlSchemaAttribute();
			xmlSchemaAttribute.Name = "namespace";
			xmlSchemaAttribute.FixedValue = uIDataSet.Namespace;
			xmlSchemaComplexType.Attributes.Add(xmlSchemaAttribute);
			XmlSchemaAttribute xmlSchemaAttribute2 = new XmlSchemaAttribute();
			xmlSchemaAttribute2.Name = "tableTypeName";
			xmlSchemaAttribute2.FixedValue = "CustomDataTable";
			xmlSchemaComplexType.Attributes.Add(xmlSchemaAttribute2);
			xmlSchemaComplexType.Particle = xmlSchemaSequence;
			XmlSchema schemaSerializable = uIDataSet.GetSchemaSerializable();
			if (xs.Contains(schemaSerializable.TargetNamespace))
			{
				MemoryStream memoryStream = new MemoryStream();
				MemoryStream memoryStream2 = new MemoryStream();
				try
				{
					XmlSchema xmlSchema = null;
					schemaSerializable.Write(memoryStream);
					IEnumerator enumerator = xs.Schemas(schemaSerializable.TargetNamespace).GetEnumerator();
					while (enumerator.MoveNext())
					{
						xmlSchema = (XmlSchema)enumerator.Current;
						memoryStream2.SetLength(0L);
						xmlSchema.Write(memoryStream2);
						if (memoryStream.Length == memoryStream2.Length)
						{
							memoryStream.Position = 0L;
							memoryStream2.Position = 0L;
							while (memoryStream.Position != memoryStream.Length && memoryStream.ReadByte() == memoryStream2.ReadByte())
							{
							}
							if (memoryStream.Position == memoryStream.Length)
							{
								return xmlSchemaComplexType;
							}
						}
					}
				}
				finally
				{
					memoryStream?.Close();
					memoryStream2?.Close();
				}
			}
			xs.Add(schemaSerializable);
			return xmlSchemaComplexType;
		}
	}

	[Serializable]
	[XmlSchemaProvider("GetTypedTableSchema")]
	public class CustomItemDataTable : DataTable, IEnumerable
	{
		private DataColumn columnID;

		private DataColumn columnItem;

		private DataColumn columnType;

		private DataColumn columnDisplay;

		private DataColumn columnGridDisplay;

		private DataColumn columnField;

		private DataColumn columnVisible;

		private DataColumn columnGridVisible;

		private DataColumn columnWidth;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public DataColumn IDColumn => columnID;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public DataColumn ItemColumn => columnItem;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public DataColumn TypeColumn => columnType;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public DataColumn DisplayColumn => columnDisplay;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public DataColumn GridDisplayColumn => columnGridDisplay;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public DataColumn FieldColumn => columnField;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public DataColumn VisibleColumn => columnVisible;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public DataColumn GridVisibleColumn => columnGridVisible;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public DataColumn WidthColumn => columnWidth;

		[DebuggerNonUserCode]
		[Browsable(false)]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public int Count => base.Rows.Count;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public CustomItemRow this[int index] => (CustomItemRow)base.Rows[index];

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public event CustomItemRowChangeEventHandler CustomItemRowChanging;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public event CustomItemRowChangeEventHandler CustomItemRowChanged;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public event CustomItemRowChangeEventHandler CustomItemRowDeleting;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public event CustomItemRowChangeEventHandler CustomItemRowDeleted;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public CustomItemDataTable()
		{
			base.TableName = "CustomItem";
			BeginInit();
			InitClass();
			EndInit();
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		internal CustomItemDataTable(DataTable table)
		{
			base.TableName = table.TableName;
			if (table.CaseSensitive != table.DataSet.CaseSensitive)
			{
				base.CaseSensitive = table.CaseSensitive;
			}
			if (table.Locale.ToString() != table.DataSet.Locale.ToString())
			{
				base.Locale = table.Locale;
			}
			if (table.Namespace != table.DataSet.Namespace)
			{
				base.Namespace = table.Namespace;
			}
			base.Prefix = table.Prefix;
			base.MinimumCapacity = table.MinimumCapacity;
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		protected CustomItemDataTable(SerializationInfo info, StreamingContext context)
			: base(info, context)
		{
			InitVars();
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public void AddCustomItemRow(CustomItemRow row)
		{
			base.Rows.Add(row);
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public CustomItemRow AddCustomItemRow(int Type, string Display, string GridDisplay, string Field, bool Visible, bool GridVisible, int Width)
		{
			CustomItemRow customItemRow = (CustomItemRow)NewRow();
			object[] itemArray = new object[9] { null, null, Type, Display, GridDisplay, Field, Visible, GridVisible, Width };
			customItemRow.ItemArray = itemArray;
			base.Rows.Add(customItemRow);
			return customItemRow;
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public CustomItemRow FindByIDItem(int ID, int Item)
		{
			return (CustomItemRow)base.Rows.Find(new object[2] { ID, Item });
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public virtual IEnumerator GetEnumerator()
		{
			return base.Rows.GetEnumerator();
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public override DataTable Clone()
		{
			CustomItemDataTable customItemDataTable = (CustomItemDataTable)base.Clone();
			customItemDataTable.InitVars();
			return customItemDataTable;
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		protected override DataTable CreateInstance()
		{
			return new CustomItemDataTable();
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		internal void InitVars()
		{
			columnID = base.Columns["ID"];
			columnItem = base.Columns["Item"];
			columnType = base.Columns["Type"];
			columnDisplay = base.Columns["Display"];
			columnGridDisplay = base.Columns["GridDisplay"];
			columnField = base.Columns["Field"];
			columnVisible = base.Columns["Visible"];
			columnGridVisible = base.Columns["GridVisible"];
			columnWidth = base.Columns["Width"];
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		private void InitClass()
		{
			columnID = new DataColumn("ID", typeof(int), null, MappingType.Element);
			base.Columns.Add(columnID);
			columnItem = new DataColumn("Item", typeof(int), null, MappingType.Element);
			columnItem.ExtendedProperties.Add("Generator_ColumnPropNameInRow", "Item");
			columnItem.ExtendedProperties.Add("Generator_ColumnPropNameInTable", "ItemColumn");
			columnItem.ExtendedProperties.Add("Generator_ColumnVarNameInTable", "columnItem");
			columnItem.ExtendedProperties.Add("Generator_UserColumnName", "Item");
			base.Columns.Add(columnItem);
			columnType = new DataColumn("Type", typeof(int), null, MappingType.Element);
			base.Columns.Add(columnType);
			columnDisplay = new DataColumn("Display", typeof(string), null, MappingType.Element);
			base.Columns.Add(columnDisplay);
			columnGridDisplay = new DataColumn("GridDisplay", typeof(string), null, MappingType.Element);
			base.Columns.Add(columnGridDisplay);
			columnField = new DataColumn("Field", typeof(string), null, MappingType.Element);
			base.Columns.Add(columnField);
			columnVisible = new DataColumn("Visible", typeof(bool), null, MappingType.Element);
			base.Columns.Add(columnVisible);
			columnGridVisible = new DataColumn("GridVisible", typeof(bool), null, MappingType.Element);
			base.Columns.Add(columnGridVisible);
			columnWidth = new DataColumn("Width", typeof(int), null, MappingType.Element);
			base.Columns.Add(columnWidth);
			base.Constraints.Add(new UniqueConstraint("Constraint1", new DataColumn[2] { columnID, columnItem }, isPrimaryKey: true));
			columnID.AutoIncrement = true;
			columnID.AllowDBNull = false;
			columnItem.AutoIncrement = true;
			columnItem.AllowDBNull = false;
			columnType.DefaultValue = 0;
			columnDisplay.DefaultValue = "";
			columnGridDisplay.DefaultValue = "";
			columnField.DefaultValue = "ID";
			columnVisible.DefaultValue = true;
			columnGridVisible.DefaultValue = true;
			columnWidth.DefaultValue = 100;
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public CustomItemRow NewCustomItemRow()
		{
			return (CustomItemRow)NewRow();
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		protected override DataRow NewRowFromBuilder(DataRowBuilder builder)
		{
			return new CustomItemRow(builder);
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		protected override Type GetRowType()
		{
			return typeof(CustomItemRow);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		protected override void OnRowChanged(DataRowChangeEventArgs e)
		{
			base.OnRowChanged(e);
			if (this.CustomItemRowChanged != null)
			{
				this.CustomItemRowChanged(this, new CustomItemRowChangeEvent((CustomItemRow)e.Row, e.Action));
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		protected override void OnRowChanging(DataRowChangeEventArgs e)
		{
			base.OnRowChanging(e);
			if (this.CustomItemRowChanging != null)
			{
				this.CustomItemRowChanging(this, new CustomItemRowChangeEvent((CustomItemRow)e.Row, e.Action));
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		protected override void OnRowDeleted(DataRowChangeEventArgs e)
		{
			base.OnRowDeleted(e);
			if (this.CustomItemRowDeleted != null)
			{
				this.CustomItemRowDeleted(this, new CustomItemRowChangeEvent((CustomItemRow)e.Row, e.Action));
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		protected override void OnRowDeleting(DataRowChangeEventArgs e)
		{
			base.OnRowDeleting(e);
			if (this.CustomItemRowDeleting != null)
			{
				this.CustomItemRowDeleting(this, new CustomItemRowChangeEvent((CustomItemRow)e.Row, e.Action));
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public void RemoveCustomItemRow(CustomItemRow row)
		{
			base.Rows.Remove(row);
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public static XmlSchemaComplexType GetTypedTableSchema(XmlSchemaSet xs)
		{
			XmlSchemaComplexType xmlSchemaComplexType = new XmlSchemaComplexType();
			XmlSchemaSequence xmlSchemaSequence = new XmlSchemaSequence();
			UIDataSet uIDataSet = new UIDataSet();
			XmlSchemaAny xmlSchemaAny = new XmlSchemaAny();
			xmlSchemaAny.Namespace = "http://www.w3.org/2001/XMLSchema";
			xmlSchemaAny.MinOccurs = 0m;
			xmlSchemaAny.MaxOccurs = decimal.MaxValue;
			xmlSchemaAny.ProcessContents = XmlSchemaContentProcessing.Lax;
			xmlSchemaSequence.Items.Add(xmlSchemaAny);
			XmlSchemaAny xmlSchemaAny2 = new XmlSchemaAny();
			xmlSchemaAny2.Namespace = "urn:schemas-microsoft-com:xml-diffgram-v1";
			xmlSchemaAny2.MinOccurs = 1m;
			xmlSchemaAny2.ProcessContents = XmlSchemaContentProcessing.Lax;
			xmlSchemaSequence.Items.Add(xmlSchemaAny2);
			XmlSchemaAttribute xmlSchemaAttribute = new XmlSchemaAttribute();
			xmlSchemaAttribute.Name = "namespace";
			xmlSchemaAttribute.FixedValue = uIDataSet.Namespace;
			xmlSchemaComplexType.Attributes.Add(xmlSchemaAttribute);
			XmlSchemaAttribute xmlSchemaAttribute2 = new XmlSchemaAttribute();
			xmlSchemaAttribute2.Name = "tableTypeName";
			xmlSchemaAttribute2.FixedValue = "CustomItemDataTable";
			xmlSchemaComplexType.Attributes.Add(xmlSchemaAttribute2);
			xmlSchemaComplexType.Particle = xmlSchemaSequence;
			XmlSchema schemaSerializable = uIDataSet.GetSchemaSerializable();
			if (xs.Contains(schemaSerializable.TargetNamespace))
			{
				MemoryStream memoryStream = new MemoryStream();
				MemoryStream memoryStream2 = new MemoryStream();
				try
				{
					XmlSchema xmlSchema = null;
					schemaSerializable.Write(memoryStream);
					IEnumerator enumerator = xs.Schemas(schemaSerializable.TargetNamespace).GetEnumerator();
					while (enumerator.MoveNext())
					{
						xmlSchema = (XmlSchema)enumerator.Current;
						memoryStream2.SetLength(0L);
						xmlSchema.Write(memoryStream2);
						if (memoryStream.Length == memoryStream2.Length)
						{
							memoryStream.Position = 0L;
							memoryStream2.Position = 0L;
							while (memoryStream.Position != memoryStream.Length && memoryStream.ReadByte() == memoryStream2.ReadByte())
							{
							}
							if (memoryStream.Position == memoryStream.Length)
							{
								return xmlSchemaComplexType;
							}
						}
					}
				}
				finally
				{
					memoryStream?.Close();
					memoryStream2?.Close();
				}
			}
			xs.Add(schemaSerializable);
			return xmlSchemaComplexType;
		}
	}

	[Serializable]
	[XmlSchemaProvider("GetTypedTableSchema")]
	public class ScPLU_LayoutDataTable : DataTable, IEnumerable
	{
		private DataColumn columnLayout;

		private DataColumn columnDisplay;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public DataColumn LayoutColumn => columnLayout;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public DataColumn DisplayColumn => columnDisplay;

		[Browsable(false)]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public int Count => base.Rows.Count;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public ScPLU_LayoutRow this[int index] => (ScPLU_LayoutRow)base.Rows[index];

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public event ScPLU_LayoutRowChangeEventHandler ScPLU_LayoutRowChanging;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public event ScPLU_LayoutRowChangeEventHandler ScPLU_LayoutRowChanged;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public event ScPLU_LayoutRowChangeEventHandler ScPLU_LayoutRowDeleting;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public event ScPLU_LayoutRowChangeEventHandler ScPLU_LayoutRowDeleted;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public ScPLU_LayoutDataTable()
		{
			base.TableName = "ScPLU_Layout";
			BeginInit();
			InitClass();
			EndInit();
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		internal ScPLU_LayoutDataTable(DataTable table)
		{
			base.TableName = table.TableName;
			if (table.CaseSensitive != table.DataSet.CaseSensitive)
			{
				base.CaseSensitive = table.CaseSensitive;
			}
			if (table.Locale.ToString() != table.DataSet.Locale.ToString())
			{
				base.Locale = table.Locale;
			}
			if (table.Namespace != table.DataSet.Namespace)
			{
				base.Namespace = table.Namespace;
			}
			base.Prefix = table.Prefix;
			base.MinimumCapacity = table.MinimumCapacity;
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		protected ScPLU_LayoutDataTable(SerializationInfo info, StreamingContext context)
			: base(info, context)
		{
			InitVars();
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public void AddScPLU_LayoutRow(ScPLU_LayoutRow row)
		{
			base.Rows.Add(row);
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public ScPLU_LayoutRow AddScPLU_LayoutRow(string Layout, string Display)
		{
			ScPLU_LayoutRow scPLU_LayoutRow = (ScPLU_LayoutRow)NewRow();
			object[] itemArray = new object[2] { Layout, Display };
			scPLU_LayoutRow.ItemArray = itemArray;
			base.Rows.Add(scPLU_LayoutRow);
			return scPLU_LayoutRow;
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public ScPLU_LayoutRow FindByLayout(string Layout)
		{
			return (ScPLU_LayoutRow)base.Rows.Find(new object[1] { Layout });
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public virtual IEnumerator GetEnumerator()
		{
			return base.Rows.GetEnumerator();
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public override DataTable Clone()
		{
			ScPLU_LayoutDataTable scPLU_LayoutDataTable = (ScPLU_LayoutDataTable)base.Clone();
			scPLU_LayoutDataTable.InitVars();
			return scPLU_LayoutDataTable;
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		protected override DataTable CreateInstance()
		{
			return new ScPLU_LayoutDataTable();
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		internal void InitVars()
		{
			columnLayout = base.Columns["Layout"];
			columnDisplay = base.Columns["Display"];
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		private void InitClass()
		{
			columnLayout = new DataColumn("Layout", typeof(string), null, MappingType.Element);
			base.Columns.Add(columnLayout);
			columnDisplay = new DataColumn("Display", typeof(string), null, MappingType.Element);
			base.Columns.Add(columnDisplay);
			base.Constraints.Add(new UniqueConstraint("Constraint1", new DataColumn[1] { columnLayout }, isPrimaryKey: true));
			columnLayout.AllowDBNull = false;
			columnLayout.ReadOnly = true;
			columnLayout.Unique = true;
			columnDisplay.AllowDBNull = false;
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public ScPLU_LayoutRow NewScPLU_LayoutRow()
		{
			return (ScPLU_LayoutRow)NewRow();
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		protected override DataRow NewRowFromBuilder(DataRowBuilder builder)
		{
			return new ScPLU_LayoutRow(builder);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		protected override Type GetRowType()
		{
			return typeof(ScPLU_LayoutRow);
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		protected override void OnRowChanged(DataRowChangeEventArgs e)
		{
			base.OnRowChanged(e);
			if (this.ScPLU_LayoutRowChanged != null)
			{
				this.ScPLU_LayoutRowChanged(this, new ScPLU_LayoutRowChangeEvent((ScPLU_LayoutRow)e.Row, e.Action));
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		protected override void OnRowChanging(DataRowChangeEventArgs e)
		{
			base.OnRowChanging(e);
			if (this.ScPLU_LayoutRowChanging != null)
			{
				this.ScPLU_LayoutRowChanging(this, new ScPLU_LayoutRowChangeEvent((ScPLU_LayoutRow)e.Row, e.Action));
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		protected override void OnRowDeleted(DataRowChangeEventArgs e)
		{
			base.OnRowDeleted(e);
			if (this.ScPLU_LayoutRowDeleted != null)
			{
				this.ScPLU_LayoutRowDeleted(this, new ScPLU_LayoutRowChangeEvent((ScPLU_LayoutRow)e.Row, e.Action));
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		protected override void OnRowDeleting(DataRowChangeEventArgs e)
		{
			base.OnRowDeleting(e);
			if (this.ScPLU_LayoutRowDeleting != null)
			{
				this.ScPLU_LayoutRowDeleting(this, new ScPLU_LayoutRowChangeEvent((ScPLU_LayoutRow)e.Row, e.Action));
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public void RemoveScPLU_LayoutRow(ScPLU_LayoutRow row)
		{
			base.Rows.Remove(row);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public static XmlSchemaComplexType GetTypedTableSchema(XmlSchemaSet xs)
		{
			XmlSchemaComplexType xmlSchemaComplexType = new XmlSchemaComplexType();
			XmlSchemaSequence xmlSchemaSequence = new XmlSchemaSequence();
			UIDataSet uIDataSet = new UIDataSet();
			XmlSchemaAny xmlSchemaAny = new XmlSchemaAny();
			xmlSchemaAny.Namespace = "http://www.w3.org/2001/XMLSchema";
			xmlSchemaAny.MinOccurs = 0m;
			xmlSchemaAny.MaxOccurs = decimal.MaxValue;
			xmlSchemaAny.ProcessContents = XmlSchemaContentProcessing.Lax;
			xmlSchemaSequence.Items.Add(xmlSchemaAny);
			XmlSchemaAny xmlSchemaAny2 = new XmlSchemaAny();
			xmlSchemaAny2.Namespace = "urn:schemas-microsoft-com:xml-diffgram-v1";
			xmlSchemaAny2.MinOccurs = 1m;
			xmlSchemaAny2.ProcessContents = XmlSchemaContentProcessing.Lax;
			xmlSchemaSequence.Items.Add(xmlSchemaAny2);
			XmlSchemaAttribute xmlSchemaAttribute = new XmlSchemaAttribute();
			xmlSchemaAttribute.Name = "namespace";
			xmlSchemaAttribute.FixedValue = uIDataSet.Namespace;
			xmlSchemaComplexType.Attributes.Add(xmlSchemaAttribute);
			XmlSchemaAttribute xmlSchemaAttribute2 = new XmlSchemaAttribute();
			xmlSchemaAttribute2.Name = "tableTypeName";
			xmlSchemaAttribute2.FixedValue = "ScPLU_LayoutDataTable";
			xmlSchemaComplexType.Attributes.Add(xmlSchemaAttribute2);
			xmlSchemaComplexType.Particle = xmlSchemaSequence;
			XmlSchema schemaSerializable = uIDataSet.GetSchemaSerializable();
			if (xs.Contains(schemaSerializable.TargetNamespace))
			{
				MemoryStream memoryStream = new MemoryStream();
				MemoryStream memoryStream2 = new MemoryStream();
				try
				{
					XmlSchema xmlSchema = null;
					schemaSerializable.Write(memoryStream);
					IEnumerator enumerator = xs.Schemas(schemaSerializable.TargetNamespace).GetEnumerator();
					while (enumerator.MoveNext())
					{
						xmlSchema = (XmlSchema)enumerator.Current;
						memoryStream2.SetLength(0L);
						xmlSchema.Write(memoryStream2);
						if (memoryStream.Length == memoryStream2.Length)
						{
							memoryStream.Position = 0L;
							memoryStream2.Position = 0L;
							while (memoryStream.Position != memoryStream.Length && memoryStream.ReadByte() == memoryStream2.ReadByte())
							{
							}
							if (memoryStream.Position == memoryStream.Length)
							{
								return xmlSchemaComplexType;
							}
						}
					}
				}
				finally
				{
					memoryStream?.Close();
					memoryStream2?.Close();
				}
			}
			xs.Add(schemaSerializable);
			return xmlSchemaComplexType;
		}
	}

	[Serializable]
	[XmlSchemaProvider("GetTypedTableSchema")]
	public class ScPLU_PageDataTable : DataTable, IEnumerable
	{
		private DataColumn columnPage;

		private DataColumn columnDisplay;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public DataColumn PageColumn => columnPage;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public DataColumn DisplayColumn => columnDisplay;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[Browsable(false)]
		[DebuggerNonUserCode]
		public int Count => base.Rows.Count;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public ScPLU_PageRow this[int index] => (ScPLU_PageRow)base.Rows[index];

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public event ScPLU_PageRowChangeEventHandler ScPLU_PageRowChanging;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public event ScPLU_PageRowChangeEventHandler ScPLU_PageRowChanged;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public event ScPLU_PageRowChangeEventHandler ScPLU_PageRowDeleting;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public event ScPLU_PageRowChangeEventHandler ScPLU_PageRowDeleted;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public ScPLU_PageDataTable()
		{
			base.TableName = "ScPLU_Page";
			BeginInit();
			InitClass();
			EndInit();
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		internal ScPLU_PageDataTable(DataTable table)
		{
			base.TableName = table.TableName;
			if (table.CaseSensitive != table.DataSet.CaseSensitive)
			{
				base.CaseSensitive = table.CaseSensitive;
			}
			if (table.Locale.ToString() != table.DataSet.Locale.ToString())
			{
				base.Locale = table.Locale;
			}
			if (table.Namespace != table.DataSet.Namespace)
			{
				base.Namespace = table.Namespace;
			}
			base.Prefix = table.Prefix;
			base.MinimumCapacity = table.MinimumCapacity;
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		protected ScPLU_PageDataTable(SerializationInfo info, StreamingContext context)
			: base(info, context)
		{
			InitVars();
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public void AddScPLU_PageRow(ScPLU_PageRow row)
		{
			base.Rows.Add(row);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public ScPLU_PageRow AddScPLU_PageRow(string Page, string Display)
		{
			ScPLU_PageRow scPLU_PageRow = (ScPLU_PageRow)NewRow();
			object[] itemArray = new object[2] { Page, Display };
			scPLU_PageRow.ItemArray = itemArray;
			base.Rows.Add(scPLU_PageRow);
			return scPLU_PageRow;
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public ScPLU_PageRow FindByPage(string Page)
		{
			return (ScPLU_PageRow)base.Rows.Find(new object[1] { Page });
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public virtual IEnumerator GetEnumerator()
		{
			return base.Rows.GetEnumerator();
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public override DataTable Clone()
		{
			ScPLU_PageDataTable scPLU_PageDataTable = (ScPLU_PageDataTable)base.Clone();
			scPLU_PageDataTable.InitVars();
			return scPLU_PageDataTable;
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		protected override DataTable CreateInstance()
		{
			return new ScPLU_PageDataTable();
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		internal void InitVars()
		{
			columnPage = base.Columns["Page"];
			columnDisplay = base.Columns["Display"];
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		private void InitClass()
		{
			columnPage = new DataColumn("Page", typeof(string), null, MappingType.Element);
			base.Columns.Add(columnPage);
			columnDisplay = new DataColumn("Display", typeof(string), null, MappingType.Element);
			base.Columns.Add(columnDisplay);
			base.Constraints.Add(new UniqueConstraint("Constraint1", new DataColumn[1] { columnPage }, isPrimaryKey: true));
			columnPage.AllowDBNull = false;
			columnPage.ReadOnly = true;
			columnPage.Unique = true;
			columnDisplay.AllowDBNull = false;
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public ScPLU_PageRow NewScPLU_PageRow()
		{
			return (ScPLU_PageRow)NewRow();
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		protected override DataRow NewRowFromBuilder(DataRowBuilder builder)
		{
			return new ScPLU_PageRow(builder);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		protected override Type GetRowType()
		{
			return typeof(ScPLU_PageRow);
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		protected override void OnRowChanged(DataRowChangeEventArgs e)
		{
			base.OnRowChanged(e);
			if (this.ScPLU_PageRowChanged != null)
			{
				this.ScPLU_PageRowChanged(this, new ScPLU_PageRowChangeEvent((ScPLU_PageRow)e.Row, e.Action));
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		protected override void OnRowChanging(DataRowChangeEventArgs e)
		{
			base.OnRowChanging(e);
			if (this.ScPLU_PageRowChanging != null)
			{
				this.ScPLU_PageRowChanging(this, new ScPLU_PageRowChangeEvent((ScPLU_PageRow)e.Row, e.Action));
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		protected override void OnRowDeleted(DataRowChangeEventArgs e)
		{
			base.OnRowDeleted(e);
			if (this.ScPLU_PageRowDeleted != null)
			{
				this.ScPLU_PageRowDeleted(this, new ScPLU_PageRowChangeEvent((ScPLU_PageRow)e.Row, e.Action));
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		protected override void OnRowDeleting(DataRowChangeEventArgs e)
		{
			base.OnRowDeleting(e);
			if (this.ScPLU_PageRowDeleting != null)
			{
				this.ScPLU_PageRowDeleting(this, new ScPLU_PageRowChangeEvent((ScPLU_PageRow)e.Row, e.Action));
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public void RemoveScPLU_PageRow(ScPLU_PageRow row)
		{
			base.Rows.Remove(row);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public static XmlSchemaComplexType GetTypedTableSchema(XmlSchemaSet xs)
		{
			XmlSchemaComplexType xmlSchemaComplexType = new XmlSchemaComplexType();
			XmlSchemaSequence xmlSchemaSequence = new XmlSchemaSequence();
			UIDataSet uIDataSet = new UIDataSet();
			XmlSchemaAny xmlSchemaAny = new XmlSchemaAny();
			xmlSchemaAny.Namespace = "http://www.w3.org/2001/XMLSchema";
			xmlSchemaAny.MinOccurs = 0m;
			xmlSchemaAny.MaxOccurs = decimal.MaxValue;
			xmlSchemaAny.ProcessContents = XmlSchemaContentProcessing.Lax;
			xmlSchemaSequence.Items.Add(xmlSchemaAny);
			XmlSchemaAny xmlSchemaAny2 = new XmlSchemaAny();
			xmlSchemaAny2.Namespace = "urn:schemas-microsoft-com:xml-diffgram-v1";
			xmlSchemaAny2.MinOccurs = 1m;
			xmlSchemaAny2.ProcessContents = XmlSchemaContentProcessing.Lax;
			xmlSchemaSequence.Items.Add(xmlSchemaAny2);
			XmlSchemaAttribute xmlSchemaAttribute = new XmlSchemaAttribute();
			xmlSchemaAttribute.Name = "namespace";
			xmlSchemaAttribute.FixedValue = uIDataSet.Namespace;
			xmlSchemaComplexType.Attributes.Add(xmlSchemaAttribute);
			XmlSchemaAttribute xmlSchemaAttribute2 = new XmlSchemaAttribute();
			xmlSchemaAttribute2.Name = "tableTypeName";
			xmlSchemaAttribute2.FixedValue = "ScPLU_PageDataTable";
			xmlSchemaComplexType.Attributes.Add(xmlSchemaAttribute2);
			xmlSchemaComplexType.Particle = xmlSchemaSequence;
			XmlSchema schemaSerializable = uIDataSet.GetSchemaSerializable();
			if (xs.Contains(schemaSerializable.TargetNamespace))
			{
				MemoryStream memoryStream = new MemoryStream();
				MemoryStream memoryStream2 = new MemoryStream();
				try
				{
					XmlSchema xmlSchema = null;
					schemaSerializable.Write(memoryStream);
					IEnumerator enumerator = xs.Schemas(schemaSerializable.TargetNamespace).GetEnumerator();
					while (enumerator.MoveNext())
					{
						xmlSchema = (XmlSchema)enumerator.Current;
						memoryStream2.SetLength(0L);
						xmlSchema.Write(memoryStream2);
						if (memoryStream.Length == memoryStream2.Length)
						{
							memoryStream.Position = 0L;
							memoryStream2.Position = 0L;
							while (memoryStream.Position != memoryStream.Length && memoryStream.ReadByte() == memoryStream2.ReadByte())
							{
							}
							if (memoryStream.Position == memoryStream.Length)
							{
								return xmlSchemaComplexType;
							}
						}
					}
				}
				finally
				{
					memoryStream?.Close();
					memoryStream2?.Close();
				}
			}
			xs.Add(schemaSerializable);
			return xmlSchemaComplexType;
		}
	}

	[Serializable]
	[XmlSchemaProvider("GetTypedTableSchema")]
	public class ScPLU_SectionDataTable : DataTable, IEnumerable
	{
		private DataColumn columnPage;

		private DataColumn columnSection;

		private DataColumn columnData_Page;

		private DataColumn columnData_Offset;

		private DataColumn columnStart_X;

		private DataColumn columnStart_Y;

		private DataColumn columnOffset_X;

		private DataColumn columnOffset_Y;

		private DataColumn columnRect_X;

		private DataColumn columnRect_Y;

		private DataColumn columnNum_X;

		private DataColumn columnNum_Y;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public DataColumn PageColumn => columnPage;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public DataColumn SectionColumn => columnSection;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public DataColumn Data_PageColumn => columnData_Page;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public DataColumn Data_OffsetColumn => columnData_Offset;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public DataColumn Start_XColumn => columnStart_X;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public DataColumn Start_YColumn => columnStart_Y;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public DataColumn Offset_XColumn => columnOffset_X;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public DataColumn Offset_YColumn => columnOffset_Y;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public DataColumn Rect_XColumn => columnRect_X;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public DataColumn Rect_YColumn => columnRect_Y;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public DataColumn Num_XColumn => columnNum_X;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public DataColumn Num_YColumn => columnNum_Y;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[Browsable(false)]
		[DebuggerNonUserCode]
		public int Count => base.Rows.Count;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public ScPLU_SectionRow this[int index] => (ScPLU_SectionRow)base.Rows[index];

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public event ScPLU_SectionRowChangeEventHandler ScPLU_SectionRowChanging;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public event ScPLU_SectionRowChangeEventHandler ScPLU_SectionRowChanged;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public event ScPLU_SectionRowChangeEventHandler ScPLU_SectionRowDeleting;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public event ScPLU_SectionRowChangeEventHandler ScPLU_SectionRowDeleted;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public ScPLU_SectionDataTable()
		{
			base.TableName = "ScPLU_Section";
			BeginInit();
			InitClass();
			EndInit();
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		internal ScPLU_SectionDataTable(DataTable table)
		{
			base.TableName = table.TableName;
			if (table.CaseSensitive != table.DataSet.CaseSensitive)
			{
				base.CaseSensitive = table.CaseSensitive;
			}
			if (table.Locale.ToString() != table.DataSet.Locale.ToString())
			{
				base.Locale = table.Locale;
			}
			if (table.Namespace != table.DataSet.Namespace)
			{
				base.Namespace = table.Namespace;
			}
			base.Prefix = table.Prefix;
			base.MinimumCapacity = table.MinimumCapacity;
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		protected ScPLU_SectionDataTable(SerializationInfo info, StreamingContext context)
			: base(info, context)
		{
			InitVars();
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public void AddScPLU_SectionRow(ScPLU_SectionRow row)
		{
			base.Rows.Add(row);
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public ScPLU_SectionRow AddScPLU_SectionRow(string Page, int Section, int Data_Page, int Data_Offset, int Start_X, int Start_Y, int Offset_X, int Offset_Y, int Rect_X, int Rect_Y, int Num_X, int Num_Y)
		{
			ScPLU_SectionRow scPLU_SectionRow = (ScPLU_SectionRow)NewRow();
			object[] itemArray = new object[12]
			{
				Page, Section, Data_Page, Data_Offset, Start_X, Start_Y, Offset_X, Offset_Y, Rect_X, Rect_Y,
				Num_X, Num_Y
			};
			scPLU_SectionRow.ItemArray = itemArray;
			base.Rows.Add(scPLU_SectionRow);
			return scPLU_SectionRow;
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public ScPLU_SectionRow FindByPageSection(string Page, int Section)
		{
			return (ScPLU_SectionRow)base.Rows.Find(new object[2] { Page, Section });
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public virtual IEnumerator GetEnumerator()
		{
			return base.Rows.GetEnumerator();
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public override DataTable Clone()
		{
			ScPLU_SectionDataTable scPLU_SectionDataTable = (ScPLU_SectionDataTable)base.Clone();
			scPLU_SectionDataTable.InitVars();
			return scPLU_SectionDataTable;
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		protected override DataTable CreateInstance()
		{
			return new ScPLU_SectionDataTable();
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		internal void InitVars()
		{
			columnPage = base.Columns["Page"];
			columnSection = base.Columns["Section"];
			columnData_Page = base.Columns["Data_Page"];
			columnData_Offset = base.Columns["Data_Offset"];
			columnStart_X = base.Columns["Start_X"];
			columnStart_Y = base.Columns["Start_Y"];
			columnOffset_X = base.Columns["Offset_X"];
			columnOffset_Y = base.Columns["Offset_Y"];
			columnRect_X = base.Columns["Rect_X"];
			columnRect_Y = base.Columns["Rect_Y"];
			columnNum_X = base.Columns["Num_X"];
			columnNum_Y = base.Columns["Num_Y"];
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		private void InitClass()
		{
			columnPage = new DataColumn("Page", typeof(string), null, MappingType.Element);
			base.Columns.Add(columnPage);
			columnSection = new DataColumn("Section", typeof(int), null, MappingType.Element);
			base.Columns.Add(columnSection);
			columnData_Page = new DataColumn("Data_Page", typeof(int), null, MappingType.Element);
			base.Columns.Add(columnData_Page);
			columnData_Offset = new DataColumn("Data_Offset", typeof(int), null, MappingType.Element);
			base.Columns.Add(columnData_Offset);
			columnStart_X = new DataColumn("Start_X", typeof(int), null, MappingType.Element);
			base.Columns.Add(columnStart_X);
			columnStart_Y = new DataColumn("Start_Y", typeof(int), null, MappingType.Element);
			base.Columns.Add(columnStart_Y);
			columnOffset_X = new DataColumn("Offset_X", typeof(int), null, MappingType.Element);
			base.Columns.Add(columnOffset_X);
			columnOffset_Y = new DataColumn("Offset_Y", typeof(int), null, MappingType.Element);
			base.Columns.Add(columnOffset_Y);
			columnRect_X = new DataColumn("Rect_X", typeof(int), null, MappingType.Element);
			base.Columns.Add(columnRect_X);
			columnRect_Y = new DataColumn("Rect_Y", typeof(int), null, MappingType.Element);
			base.Columns.Add(columnRect_Y);
			columnNum_X = new DataColumn("Num_X", typeof(int), null, MappingType.Element);
			base.Columns.Add(columnNum_X);
			columnNum_Y = new DataColumn("Num_Y", typeof(int), null, MappingType.Element);
			base.Columns.Add(columnNum_Y);
			base.Constraints.Add(new UniqueConstraint("Constraint1", new DataColumn[2] { columnPage, columnSection }, isPrimaryKey: true));
			columnPage.AllowDBNull = false;
			columnSection.AllowDBNull = false;
			columnSection.ReadOnly = true;
			columnStart_X.DefaultValue = 0;
			columnStart_Y.DefaultValue = 0;
			columnOffset_X.DefaultValue = 0;
			columnOffset_Y.DefaultValue = 0;
			columnRect_X.DefaultValue = 0;
			columnRect_Y.DefaultValue = 0;
			columnNum_X.DefaultValue = 0;
			columnNum_Y.DefaultValue = 0;
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public ScPLU_SectionRow NewScPLU_SectionRow()
		{
			return (ScPLU_SectionRow)NewRow();
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		protected override DataRow NewRowFromBuilder(DataRowBuilder builder)
		{
			return new ScPLU_SectionRow(builder);
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		protected override Type GetRowType()
		{
			return typeof(ScPLU_SectionRow);
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		protected override void OnRowChanged(DataRowChangeEventArgs e)
		{
			base.OnRowChanged(e);
			if (this.ScPLU_SectionRowChanged != null)
			{
				this.ScPLU_SectionRowChanged(this, new ScPLU_SectionRowChangeEvent((ScPLU_SectionRow)e.Row, e.Action));
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		protected override void OnRowChanging(DataRowChangeEventArgs e)
		{
			base.OnRowChanging(e);
			if (this.ScPLU_SectionRowChanging != null)
			{
				this.ScPLU_SectionRowChanging(this, new ScPLU_SectionRowChangeEvent((ScPLU_SectionRow)e.Row, e.Action));
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		protected override void OnRowDeleted(DataRowChangeEventArgs e)
		{
			base.OnRowDeleted(e);
			if (this.ScPLU_SectionRowDeleted != null)
			{
				this.ScPLU_SectionRowDeleted(this, new ScPLU_SectionRowChangeEvent((ScPLU_SectionRow)e.Row, e.Action));
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		protected override void OnRowDeleting(DataRowChangeEventArgs e)
		{
			base.OnRowDeleting(e);
			if (this.ScPLU_SectionRowDeleting != null)
			{
				this.ScPLU_SectionRowDeleting(this, new ScPLU_SectionRowChangeEvent((ScPLU_SectionRow)e.Row, e.Action));
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public void RemoveScPLU_SectionRow(ScPLU_SectionRow row)
		{
			base.Rows.Remove(row);
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public static XmlSchemaComplexType GetTypedTableSchema(XmlSchemaSet xs)
		{
			XmlSchemaComplexType xmlSchemaComplexType = new XmlSchemaComplexType();
			XmlSchemaSequence xmlSchemaSequence = new XmlSchemaSequence();
			UIDataSet uIDataSet = new UIDataSet();
			XmlSchemaAny xmlSchemaAny = new XmlSchemaAny();
			xmlSchemaAny.Namespace = "http://www.w3.org/2001/XMLSchema";
			xmlSchemaAny.MinOccurs = 0m;
			xmlSchemaAny.MaxOccurs = decimal.MaxValue;
			xmlSchemaAny.ProcessContents = XmlSchemaContentProcessing.Lax;
			xmlSchemaSequence.Items.Add(xmlSchemaAny);
			XmlSchemaAny xmlSchemaAny2 = new XmlSchemaAny();
			xmlSchemaAny2.Namespace = "urn:schemas-microsoft-com:xml-diffgram-v1";
			xmlSchemaAny2.MinOccurs = 1m;
			xmlSchemaAny2.ProcessContents = XmlSchemaContentProcessing.Lax;
			xmlSchemaSequence.Items.Add(xmlSchemaAny2);
			XmlSchemaAttribute xmlSchemaAttribute = new XmlSchemaAttribute();
			xmlSchemaAttribute.Name = "namespace";
			xmlSchemaAttribute.FixedValue = uIDataSet.Namespace;
			xmlSchemaComplexType.Attributes.Add(xmlSchemaAttribute);
			XmlSchemaAttribute xmlSchemaAttribute2 = new XmlSchemaAttribute();
			xmlSchemaAttribute2.Name = "tableTypeName";
			xmlSchemaAttribute2.FixedValue = "ScPLU_SectionDataTable";
			xmlSchemaComplexType.Attributes.Add(xmlSchemaAttribute2);
			xmlSchemaComplexType.Particle = xmlSchemaSequence;
			XmlSchema schemaSerializable = uIDataSet.GetSchemaSerializable();
			if (xs.Contains(schemaSerializable.TargetNamespace))
			{
				MemoryStream memoryStream = new MemoryStream();
				MemoryStream memoryStream2 = new MemoryStream();
				try
				{
					XmlSchema xmlSchema = null;
					schemaSerializable.Write(memoryStream);
					IEnumerator enumerator = xs.Schemas(schemaSerializable.TargetNamespace).GetEnumerator();
					while (enumerator.MoveNext())
					{
						xmlSchema = (XmlSchema)enumerator.Current;
						memoryStream2.SetLength(0L);
						xmlSchema.Write(memoryStream2);
						if (memoryStream.Length == memoryStream2.Length)
						{
							memoryStream.Position = 0L;
							memoryStream2.Position = 0L;
							while (memoryStream.Position != memoryStream.Length && memoryStream.ReadByte() == memoryStream2.ReadByte())
							{
							}
							if (memoryStream.Position == memoryStream.Length)
							{
								return xmlSchemaComplexType;
							}
						}
					}
				}
				finally
				{
					memoryStream?.Close();
					memoryStream2?.Close();
				}
			}
			xs.Add(schemaSerializable);
			return xmlSchemaComplexType;
		}
	}

	[Serializable]
	[XmlSchemaProvider("GetTypedTableSchema")]
	public class ScPLU_PageInfoDataTable : DataTable, IEnumerable
	{
		private DataColumn columnPage;

		private DataColumn columnBitmap;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public DataColumn PageColumn => columnPage;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public DataColumn BitmapColumn => columnBitmap;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[Browsable(false)]
		public int Count => base.Rows.Count;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public ScPLU_PageInfoRow this[int index] => (ScPLU_PageInfoRow)base.Rows[index];

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public event ScPLU_PageInfoRowChangeEventHandler ScPLU_PageInfoRowChanging;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public event ScPLU_PageInfoRowChangeEventHandler ScPLU_PageInfoRowChanged;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public event ScPLU_PageInfoRowChangeEventHandler ScPLU_PageInfoRowDeleting;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public event ScPLU_PageInfoRowChangeEventHandler ScPLU_PageInfoRowDeleted;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public ScPLU_PageInfoDataTable()
		{
			base.TableName = "ScPLU_PageInfo";
			BeginInit();
			InitClass();
			EndInit();
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		internal ScPLU_PageInfoDataTable(DataTable table)
		{
			base.TableName = table.TableName;
			if (table.CaseSensitive != table.DataSet.CaseSensitive)
			{
				base.CaseSensitive = table.CaseSensitive;
			}
			if (table.Locale.ToString() != table.DataSet.Locale.ToString())
			{
				base.Locale = table.Locale;
			}
			if (table.Namespace != table.DataSet.Namespace)
			{
				base.Namespace = table.Namespace;
			}
			base.Prefix = table.Prefix;
			base.MinimumCapacity = table.MinimumCapacity;
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		protected ScPLU_PageInfoDataTable(SerializationInfo info, StreamingContext context)
			: base(info, context)
		{
			InitVars();
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public void AddScPLU_PageInfoRow(ScPLU_PageInfoRow row)
		{
			base.Rows.Add(row);
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public ScPLU_PageInfoRow AddScPLU_PageInfoRow(string Page, string Bitmap)
		{
			ScPLU_PageInfoRow scPLU_PageInfoRow = (ScPLU_PageInfoRow)NewRow();
			object[] itemArray = new object[2] { Page, Bitmap };
			scPLU_PageInfoRow.ItemArray = itemArray;
			base.Rows.Add(scPLU_PageInfoRow);
			return scPLU_PageInfoRow;
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public ScPLU_PageInfoRow FindByPage(string Page)
		{
			return (ScPLU_PageInfoRow)base.Rows.Find(new object[1] { Page });
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public virtual IEnumerator GetEnumerator()
		{
			return base.Rows.GetEnumerator();
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public override DataTable Clone()
		{
			ScPLU_PageInfoDataTable scPLU_PageInfoDataTable = (ScPLU_PageInfoDataTable)base.Clone();
			scPLU_PageInfoDataTable.InitVars();
			return scPLU_PageInfoDataTable;
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		protected override DataTable CreateInstance()
		{
			return new ScPLU_PageInfoDataTable();
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		internal void InitVars()
		{
			columnPage = base.Columns["Page"];
			columnBitmap = base.Columns["Bitmap"];
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		private void InitClass()
		{
			columnPage = new DataColumn("Page", typeof(string), null, MappingType.Element);
			base.Columns.Add(columnPage);
			columnBitmap = new DataColumn("Bitmap", typeof(string), null, MappingType.Element);
			base.Columns.Add(columnBitmap);
			base.Constraints.Add(new UniqueConstraint("Constraint1", new DataColumn[1] { columnPage }, isPrimaryKey: true));
			columnPage.AllowDBNull = false;
			columnPage.ReadOnly = true;
			columnPage.Unique = true;
			columnPage.Caption = "Name";
			columnBitmap.Caption = "Display";
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public ScPLU_PageInfoRow NewScPLU_PageInfoRow()
		{
			return (ScPLU_PageInfoRow)NewRow();
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		protected override DataRow NewRowFromBuilder(DataRowBuilder builder)
		{
			return new ScPLU_PageInfoRow(builder);
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		protected override Type GetRowType()
		{
			return typeof(ScPLU_PageInfoRow);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		protected override void OnRowChanged(DataRowChangeEventArgs e)
		{
			base.OnRowChanged(e);
			if (this.ScPLU_PageInfoRowChanged != null)
			{
				this.ScPLU_PageInfoRowChanged(this, new ScPLU_PageInfoRowChangeEvent((ScPLU_PageInfoRow)e.Row, e.Action));
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		protected override void OnRowChanging(DataRowChangeEventArgs e)
		{
			base.OnRowChanging(e);
			if (this.ScPLU_PageInfoRowChanging != null)
			{
				this.ScPLU_PageInfoRowChanging(this, new ScPLU_PageInfoRowChangeEvent((ScPLU_PageInfoRow)e.Row, e.Action));
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		protected override void OnRowDeleted(DataRowChangeEventArgs e)
		{
			base.OnRowDeleted(e);
			if (this.ScPLU_PageInfoRowDeleted != null)
			{
				this.ScPLU_PageInfoRowDeleted(this, new ScPLU_PageInfoRowChangeEvent((ScPLU_PageInfoRow)e.Row, e.Action));
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		protected override void OnRowDeleting(DataRowChangeEventArgs e)
		{
			base.OnRowDeleting(e);
			if (this.ScPLU_PageInfoRowDeleting != null)
			{
				this.ScPLU_PageInfoRowDeleting(this, new ScPLU_PageInfoRowChangeEvent((ScPLU_PageInfoRow)e.Row, e.Action));
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public void RemoveScPLU_PageInfoRow(ScPLU_PageInfoRow row)
		{
			base.Rows.Remove(row);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public static XmlSchemaComplexType GetTypedTableSchema(XmlSchemaSet xs)
		{
			XmlSchemaComplexType xmlSchemaComplexType = new XmlSchemaComplexType();
			XmlSchemaSequence xmlSchemaSequence = new XmlSchemaSequence();
			UIDataSet uIDataSet = new UIDataSet();
			XmlSchemaAny xmlSchemaAny = new XmlSchemaAny();
			xmlSchemaAny.Namespace = "http://www.w3.org/2001/XMLSchema";
			xmlSchemaAny.MinOccurs = 0m;
			xmlSchemaAny.MaxOccurs = decimal.MaxValue;
			xmlSchemaAny.ProcessContents = XmlSchemaContentProcessing.Lax;
			xmlSchemaSequence.Items.Add(xmlSchemaAny);
			XmlSchemaAny xmlSchemaAny2 = new XmlSchemaAny();
			xmlSchemaAny2.Namespace = "urn:schemas-microsoft-com:xml-diffgram-v1";
			xmlSchemaAny2.MinOccurs = 1m;
			xmlSchemaAny2.ProcessContents = XmlSchemaContentProcessing.Lax;
			xmlSchemaSequence.Items.Add(xmlSchemaAny2);
			XmlSchemaAttribute xmlSchemaAttribute = new XmlSchemaAttribute();
			xmlSchemaAttribute.Name = "namespace";
			xmlSchemaAttribute.FixedValue = uIDataSet.Namespace;
			xmlSchemaComplexType.Attributes.Add(xmlSchemaAttribute);
			XmlSchemaAttribute xmlSchemaAttribute2 = new XmlSchemaAttribute();
			xmlSchemaAttribute2.Name = "tableTypeName";
			xmlSchemaAttribute2.FixedValue = "ScPLU_PageInfoDataTable";
			xmlSchemaComplexType.Attributes.Add(xmlSchemaAttribute2);
			xmlSchemaComplexType.Particle = xmlSchemaSequence;
			XmlSchema schemaSerializable = uIDataSet.GetSchemaSerializable();
			if (xs.Contains(schemaSerializable.TargetNamespace))
			{
				MemoryStream memoryStream = new MemoryStream();
				MemoryStream memoryStream2 = new MemoryStream();
				try
				{
					XmlSchema xmlSchema = null;
					schemaSerializable.Write(memoryStream);
					IEnumerator enumerator = xs.Schemas(schemaSerializable.TargetNamespace).GetEnumerator();
					while (enumerator.MoveNext())
					{
						xmlSchema = (XmlSchema)enumerator.Current;
						memoryStream2.SetLength(0L);
						xmlSchema.Write(memoryStream2);
						if (memoryStream.Length == memoryStream2.Length)
						{
							memoryStream.Position = 0L;
							memoryStream2.Position = 0L;
							while (memoryStream.Position != memoryStream.Length && memoryStream.ReadByte() == memoryStream2.ReadByte())
							{
							}
							if (memoryStream.Position == memoryStream.Length)
							{
								return xmlSchemaComplexType;
							}
						}
					}
				}
				finally
				{
					memoryStream?.Close();
					memoryStream2?.Close();
				}
			}
			xs.Add(schemaSerializable);
			return xmlSchemaComplexType;
		}
	}

	[Serializable]
	[XmlSchemaProvider("GetTypedTableSchema")]
	public class TXTForm_TypeDataTable : DataTable, IEnumerable
	{
		private DataColumn columnDisplay;

		private DataColumn columnFormat;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public DataColumn DisplayColumn => columnDisplay;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public DataColumn FormatColumn => columnFormat;

		[Browsable(false)]
		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public int Count => base.Rows.Count;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public TXTForm_TypeRow this[int index] => (TXTForm_TypeRow)base.Rows[index];

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public event TXTForm_TypeRowChangeEventHandler TXTForm_TypeRowChanging;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public event TXTForm_TypeRowChangeEventHandler TXTForm_TypeRowChanged;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public event TXTForm_TypeRowChangeEventHandler TXTForm_TypeRowDeleting;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public event TXTForm_TypeRowChangeEventHandler TXTForm_TypeRowDeleted;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public TXTForm_TypeDataTable()
		{
			base.TableName = "TXTForm_Type";
			BeginInit();
			InitClass();
			EndInit();
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		internal TXTForm_TypeDataTable(DataTable table)
		{
			base.TableName = table.TableName;
			if (table.CaseSensitive != table.DataSet.CaseSensitive)
			{
				base.CaseSensitive = table.CaseSensitive;
			}
			if (table.Locale.ToString() != table.DataSet.Locale.ToString())
			{
				base.Locale = table.Locale;
			}
			if (table.Namespace != table.DataSet.Namespace)
			{
				base.Namespace = table.Namespace;
			}
			base.Prefix = table.Prefix;
			base.MinimumCapacity = table.MinimumCapacity;
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		protected TXTForm_TypeDataTable(SerializationInfo info, StreamingContext context)
			: base(info, context)
		{
			InitVars();
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public void AddTXTForm_TypeRow(TXTForm_TypeRow row)
		{
			base.Rows.Add(row);
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public TXTForm_TypeRow AddTXTForm_TypeRow(string Display, string Format)
		{
			TXTForm_TypeRow tXTForm_TypeRow = (TXTForm_TypeRow)NewRow();
			object[] itemArray = new object[2] { Display, Format };
			tXTForm_TypeRow.ItemArray = itemArray;
			base.Rows.Add(tXTForm_TypeRow);
			return tXTForm_TypeRow;
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public TXTForm_TypeRow FindByDisplay(string Display)
		{
			return (TXTForm_TypeRow)base.Rows.Find(new object[1] { Display });
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public virtual IEnumerator GetEnumerator()
		{
			return base.Rows.GetEnumerator();
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public override DataTable Clone()
		{
			TXTForm_TypeDataTable tXTForm_TypeDataTable = (TXTForm_TypeDataTable)base.Clone();
			tXTForm_TypeDataTable.InitVars();
			return tXTForm_TypeDataTable;
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		protected override DataTable CreateInstance()
		{
			return new TXTForm_TypeDataTable();
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		internal void InitVars()
		{
			columnDisplay = base.Columns["Display"];
			columnFormat = base.Columns["Format"];
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		private void InitClass()
		{
			columnDisplay = new DataColumn("Display", typeof(string), null, MappingType.Element);
			base.Columns.Add(columnDisplay);
			columnFormat = new DataColumn("Format", typeof(string), null, MappingType.Element);
			base.Columns.Add(columnFormat);
			base.Constraints.Add(new UniqueConstraint("Constraint1", new DataColumn[1] { columnDisplay }, isPrimaryKey: true));
			columnDisplay.AllowDBNull = false;
			columnDisplay.ReadOnly = true;
			columnDisplay.Unique = true;
			columnDisplay.Caption = "Layout";
			columnFormat.AllowDBNull = false;
			columnFormat.Caption = "Display";
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public TXTForm_TypeRow NewTXTForm_TypeRow()
		{
			return (TXTForm_TypeRow)NewRow();
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		protected override DataRow NewRowFromBuilder(DataRowBuilder builder)
		{
			return new TXTForm_TypeRow(builder);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		protected override Type GetRowType()
		{
			return typeof(TXTForm_TypeRow);
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		protected override void OnRowChanged(DataRowChangeEventArgs e)
		{
			base.OnRowChanged(e);
			if (this.TXTForm_TypeRowChanged != null)
			{
				this.TXTForm_TypeRowChanged(this, new TXTForm_TypeRowChangeEvent((TXTForm_TypeRow)e.Row, e.Action));
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		protected override void OnRowChanging(DataRowChangeEventArgs e)
		{
			base.OnRowChanging(e);
			if (this.TXTForm_TypeRowChanging != null)
			{
				this.TXTForm_TypeRowChanging(this, new TXTForm_TypeRowChangeEvent((TXTForm_TypeRow)e.Row, e.Action));
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		protected override void OnRowDeleted(DataRowChangeEventArgs e)
		{
			base.OnRowDeleted(e);
			if (this.TXTForm_TypeRowDeleted != null)
			{
				this.TXTForm_TypeRowDeleted(this, new TXTForm_TypeRowChangeEvent((TXTForm_TypeRow)e.Row, e.Action));
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		protected override void OnRowDeleting(DataRowChangeEventArgs e)
		{
			base.OnRowDeleting(e);
			if (this.TXTForm_TypeRowDeleting != null)
			{
				this.TXTForm_TypeRowDeleting(this, new TXTForm_TypeRowChangeEvent((TXTForm_TypeRow)e.Row, e.Action));
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public void RemoveTXTForm_TypeRow(TXTForm_TypeRow row)
		{
			base.Rows.Remove(row);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public static XmlSchemaComplexType GetTypedTableSchema(XmlSchemaSet xs)
		{
			XmlSchemaComplexType xmlSchemaComplexType = new XmlSchemaComplexType();
			XmlSchemaSequence xmlSchemaSequence = new XmlSchemaSequence();
			UIDataSet uIDataSet = new UIDataSet();
			XmlSchemaAny xmlSchemaAny = new XmlSchemaAny();
			xmlSchemaAny.Namespace = "http://www.w3.org/2001/XMLSchema";
			xmlSchemaAny.MinOccurs = 0m;
			xmlSchemaAny.MaxOccurs = decimal.MaxValue;
			xmlSchemaAny.ProcessContents = XmlSchemaContentProcessing.Lax;
			xmlSchemaSequence.Items.Add(xmlSchemaAny);
			XmlSchemaAny xmlSchemaAny2 = new XmlSchemaAny();
			xmlSchemaAny2.Namespace = "urn:schemas-microsoft-com:xml-diffgram-v1";
			xmlSchemaAny2.MinOccurs = 1m;
			xmlSchemaAny2.ProcessContents = XmlSchemaContentProcessing.Lax;
			xmlSchemaSequence.Items.Add(xmlSchemaAny2);
			XmlSchemaAttribute xmlSchemaAttribute = new XmlSchemaAttribute();
			xmlSchemaAttribute.Name = "namespace";
			xmlSchemaAttribute.FixedValue = uIDataSet.Namespace;
			xmlSchemaComplexType.Attributes.Add(xmlSchemaAttribute);
			XmlSchemaAttribute xmlSchemaAttribute2 = new XmlSchemaAttribute();
			xmlSchemaAttribute2.Name = "tableTypeName";
			xmlSchemaAttribute2.FixedValue = "TXTForm_TypeDataTable";
			xmlSchemaComplexType.Attributes.Add(xmlSchemaAttribute2);
			xmlSchemaComplexType.Particle = xmlSchemaSequence;
			XmlSchema schemaSerializable = uIDataSet.GetSchemaSerializable();
			if (xs.Contains(schemaSerializable.TargetNamespace))
			{
				MemoryStream memoryStream = new MemoryStream();
				MemoryStream memoryStream2 = new MemoryStream();
				try
				{
					XmlSchema xmlSchema = null;
					schemaSerializable.Write(memoryStream);
					IEnumerator enumerator = xs.Schemas(schemaSerializable.TargetNamespace).GetEnumerator();
					while (enumerator.MoveNext())
					{
						xmlSchema = (XmlSchema)enumerator.Current;
						memoryStream2.SetLength(0L);
						xmlSchema.Write(memoryStream2);
						if (memoryStream.Length == memoryStream2.Length)
						{
							memoryStream.Position = 0L;
							memoryStream2.Position = 0L;
							while (memoryStream.Position != memoryStream.Length && memoryStream.ReadByte() == memoryStream2.ReadByte())
							{
							}
							if (memoryStream.Position == memoryStream.Length)
							{
								return xmlSchemaComplexType;
							}
						}
					}
				}
				finally
				{
					memoryStream?.Close();
					memoryStream2?.Close();
				}
			}
			xs.Add(schemaSerializable);
			return xmlSchemaComplexType;
		}
	}

	[Serializable]
	[XmlSchemaProvider("GetTypedTableSchema")]
	public class SimComboDataTable : DataTable, IEnumerable
	{
		private DataColumn columnName;

		private DataColumn columnValueDisplay;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public DataColumn NameColumn => columnName;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public DataColumn ValueDisplayColumn => columnValueDisplay;

		[Browsable(false)]
		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public int Count => base.Rows.Count;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public SimComboRow this[int index] => (SimComboRow)base.Rows[index];

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public event SimComboRowChangeEventHandler SimComboRowChanging;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public event SimComboRowChangeEventHandler SimComboRowChanged;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public event SimComboRowChangeEventHandler SimComboRowDeleting;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public event SimComboRowChangeEventHandler SimComboRowDeleted;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public SimComboDataTable()
		{
			base.TableName = "SimCombo";
			BeginInit();
			InitClass();
			EndInit();
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		internal SimComboDataTable(DataTable table)
		{
			base.TableName = table.TableName;
			if (table.CaseSensitive != table.DataSet.CaseSensitive)
			{
				base.CaseSensitive = table.CaseSensitive;
			}
			if (table.Locale.ToString() != table.DataSet.Locale.ToString())
			{
				base.Locale = table.Locale;
			}
			if (table.Namespace != table.DataSet.Namespace)
			{
				base.Namespace = table.Namespace;
			}
			base.Prefix = table.Prefix;
			base.MinimumCapacity = table.MinimumCapacity;
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		protected SimComboDataTable(SerializationInfo info, StreamingContext context)
			: base(info, context)
		{
			InitVars();
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public void AddSimComboRow(SimComboRow row)
		{
			base.Rows.Add(row);
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public SimComboRow AddSimComboRow(string Name, string ValueDisplay)
		{
			SimComboRow simComboRow = (SimComboRow)NewRow();
			object[] itemArray = new object[2] { Name, ValueDisplay };
			simComboRow.ItemArray = itemArray;
			base.Rows.Add(simComboRow);
			return simComboRow;
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public SimComboRow FindByName(string Name)
		{
			return (SimComboRow)base.Rows.Find(new object[1] { Name });
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public virtual IEnumerator GetEnumerator()
		{
			return base.Rows.GetEnumerator();
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public override DataTable Clone()
		{
			SimComboDataTable simComboDataTable = (SimComboDataTable)base.Clone();
			simComboDataTable.InitVars();
			return simComboDataTable;
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		protected override DataTable CreateInstance()
		{
			return new SimComboDataTable();
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		internal void InitVars()
		{
			columnName = base.Columns["Name"];
			columnValueDisplay = base.Columns["ValueDisplay"];
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		private void InitClass()
		{
			columnName = new DataColumn("Name", typeof(string), null, MappingType.Element);
			base.Columns.Add(columnName);
			columnValueDisplay = new DataColumn("ValueDisplay", typeof(string), null, MappingType.Element);
			base.Columns.Add(columnValueDisplay);
			base.Constraints.Add(new UniqueConstraint("Constraint1", new DataColumn[1] { columnName }, isPrimaryKey: true));
			columnName.AllowDBNull = false;
			columnName.ReadOnly = true;
			columnName.Unique = true;
			columnValueDisplay.AllowDBNull = false;
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public SimComboRow NewSimComboRow()
		{
			return (SimComboRow)NewRow();
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		protected override DataRow NewRowFromBuilder(DataRowBuilder builder)
		{
			return new SimComboRow(builder);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		protected override Type GetRowType()
		{
			return typeof(SimComboRow);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		protected override void OnRowChanged(DataRowChangeEventArgs e)
		{
			base.OnRowChanged(e);
			if (this.SimComboRowChanged != null)
			{
				this.SimComboRowChanged(this, new SimComboRowChangeEvent((SimComboRow)e.Row, e.Action));
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		protected override void OnRowChanging(DataRowChangeEventArgs e)
		{
			base.OnRowChanging(e);
			if (this.SimComboRowChanging != null)
			{
				this.SimComboRowChanging(this, new SimComboRowChangeEvent((SimComboRow)e.Row, e.Action));
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		protected override void OnRowDeleted(DataRowChangeEventArgs e)
		{
			base.OnRowDeleted(e);
			if (this.SimComboRowDeleted != null)
			{
				this.SimComboRowDeleted(this, new SimComboRowChangeEvent((SimComboRow)e.Row, e.Action));
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		protected override void OnRowDeleting(DataRowChangeEventArgs e)
		{
			base.OnRowDeleting(e);
			if (this.SimComboRowDeleting != null)
			{
				this.SimComboRowDeleting(this, new SimComboRowChangeEvent((SimComboRow)e.Row, e.Action));
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public void RemoveSimComboRow(SimComboRow row)
		{
			base.Rows.Remove(row);
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public static XmlSchemaComplexType GetTypedTableSchema(XmlSchemaSet xs)
		{
			XmlSchemaComplexType xmlSchemaComplexType = new XmlSchemaComplexType();
			XmlSchemaSequence xmlSchemaSequence = new XmlSchemaSequence();
			UIDataSet uIDataSet = new UIDataSet();
			XmlSchemaAny xmlSchemaAny = new XmlSchemaAny();
			xmlSchemaAny.Namespace = "http://www.w3.org/2001/XMLSchema";
			xmlSchemaAny.MinOccurs = 0m;
			xmlSchemaAny.MaxOccurs = decimal.MaxValue;
			xmlSchemaAny.ProcessContents = XmlSchemaContentProcessing.Lax;
			xmlSchemaSequence.Items.Add(xmlSchemaAny);
			XmlSchemaAny xmlSchemaAny2 = new XmlSchemaAny();
			xmlSchemaAny2.Namespace = "urn:schemas-microsoft-com:xml-diffgram-v1";
			xmlSchemaAny2.MinOccurs = 1m;
			xmlSchemaAny2.ProcessContents = XmlSchemaContentProcessing.Lax;
			xmlSchemaSequence.Items.Add(xmlSchemaAny2);
			XmlSchemaAttribute xmlSchemaAttribute = new XmlSchemaAttribute();
			xmlSchemaAttribute.Name = "namespace";
			xmlSchemaAttribute.FixedValue = uIDataSet.Namespace;
			xmlSchemaComplexType.Attributes.Add(xmlSchemaAttribute);
			XmlSchemaAttribute xmlSchemaAttribute2 = new XmlSchemaAttribute();
			xmlSchemaAttribute2.Name = "tableTypeName";
			xmlSchemaAttribute2.FixedValue = "SimComboDataTable";
			xmlSchemaComplexType.Attributes.Add(xmlSchemaAttribute2);
			xmlSchemaComplexType.Particle = xmlSchemaSequence;
			XmlSchema schemaSerializable = uIDataSet.GetSchemaSerializable();
			if (xs.Contains(schemaSerializable.TargetNamespace))
			{
				MemoryStream memoryStream = new MemoryStream();
				MemoryStream memoryStream2 = new MemoryStream();
				try
				{
					XmlSchema xmlSchema = null;
					schemaSerializable.Write(memoryStream);
					IEnumerator enumerator = xs.Schemas(schemaSerializable.TargetNamespace).GetEnumerator();
					while (enumerator.MoveNext())
					{
						xmlSchema = (XmlSchema)enumerator.Current;
						memoryStream2.SetLength(0L);
						xmlSchema.Write(memoryStream2);
						if (memoryStream.Length == memoryStream2.Length)
						{
							memoryStream.Position = 0L;
							memoryStream2.Position = 0L;
							while (memoryStream.Position != memoryStream.Length && memoryStream.ReadByte() == memoryStream2.ReadByte())
							{
							}
							if (memoryStream.Position == memoryStream.Length)
							{
								return xmlSchemaComplexType;
							}
						}
					}
				}
				finally
				{
					memoryStream?.Close();
					memoryStream2?.Close();
				}
			}
			xs.Add(schemaSerializable);
			return xmlSchemaComplexType;
		}
	}

	[Serializable]
	[XmlSchemaProvider("GetTypedTableSchema")]
	public class LangDataTable : DataTable, IEnumerable
	{
		private DataColumn columnName;

		private DataColumn columnDisplay;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public DataColumn NameColumn => columnName;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public DataColumn DisplayColumn => columnDisplay;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[Browsable(false)]
		[DebuggerNonUserCode]
		public int Count => base.Rows.Count;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public LangRow this[int index] => (LangRow)base.Rows[index];

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public event LangRowChangeEventHandler LangRowChanging;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public event LangRowChangeEventHandler LangRowChanged;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public event LangRowChangeEventHandler LangRowDeleting;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public event LangRowChangeEventHandler LangRowDeleted;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public LangDataTable()
		{
			base.TableName = "Lang";
			BeginInit();
			InitClass();
			EndInit();
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		internal LangDataTable(DataTable table)
		{
			base.TableName = table.TableName;
			if (table.CaseSensitive != table.DataSet.CaseSensitive)
			{
				base.CaseSensitive = table.CaseSensitive;
			}
			if (table.Locale.ToString() != table.DataSet.Locale.ToString())
			{
				base.Locale = table.Locale;
			}
			if (table.Namespace != table.DataSet.Namespace)
			{
				base.Namespace = table.Namespace;
			}
			base.Prefix = table.Prefix;
			base.MinimumCapacity = table.MinimumCapacity;
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		protected LangDataTable(SerializationInfo info, StreamingContext context)
			: base(info, context)
		{
			InitVars();
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public void AddLangRow(LangRow row)
		{
			base.Rows.Add(row);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public LangRow AddLangRow(string Name, string Display)
		{
			LangRow langRow = (LangRow)NewRow();
			object[] itemArray = new object[2] { Name, Display };
			langRow.ItemArray = itemArray;
			base.Rows.Add(langRow);
			return langRow;
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public LangRow FindByName(string Name)
		{
			return (LangRow)base.Rows.Find(new object[1] { Name });
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public virtual IEnumerator GetEnumerator()
		{
			return base.Rows.GetEnumerator();
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public override DataTable Clone()
		{
			LangDataTable langDataTable = (LangDataTable)base.Clone();
			langDataTable.InitVars();
			return langDataTable;
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		protected override DataTable CreateInstance()
		{
			return new LangDataTable();
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		internal void InitVars()
		{
			columnName = base.Columns["Name"];
			columnDisplay = base.Columns["Display"];
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		private void InitClass()
		{
			columnName = new DataColumn("Name", typeof(string), null, MappingType.Element);
			base.Columns.Add(columnName);
			columnDisplay = new DataColumn("Display", typeof(string), null, MappingType.Element);
			base.Columns.Add(columnDisplay);
			base.Constraints.Add(new UniqueConstraint("Constraint1", new DataColumn[1] { columnName }, isPrimaryKey: true));
			columnName.AllowDBNull = false;
			columnName.ReadOnly = true;
			columnName.Unique = true;
			columnDisplay.AllowDBNull = false;
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public LangRow NewLangRow()
		{
			return (LangRow)NewRow();
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		protected override DataRow NewRowFromBuilder(DataRowBuilder builder)
		{
			return new LangRow(builder);
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		protected override Type GetRowType()
		{
			return typeof(LangRow);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		protected override void OnRowChanged(DataRowChangeEventArgs e)
		{
			base.OnRowChanged(e);
			if (this.LangRowChanged != null)
			{
				this.LangRowChanged(this, new LangRowChangeEvent((LangRow)e.Row, e.Action));
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		protected override void OnRowChanging(DataRowChangeEventArgs e)
		{
			base.OnRowChanging(e);
			if (this.LangRowChanging != null)
			{
				this.LangRowChanging(this, new LangRowChangeEvent((LangRow)e.Row, e.Action));
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		protected override void OnRowDeleted(DataRowChangeEventArgs e)
		{
			base.OnRowDeleted(e);
			if (this.LangRowDeleted != null)
			{
				this.LangRowDeleted(this, new LangRowChangeEvent((LangRow)e.Row, e.Action));
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		protected override void OnRowDeleting(DataRowChangeEventArgs e)
		{
			base.OnRowDeleting(e);
			if (this.LangRowDeleting != null)
			{
				this.LangRowDeleting(this, new LangRowChangeEvent((LangRow)e.Row, e.Action));
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public void RemoveLangRow(LangRow row)
		{
			base.Rows.Remove(row);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public static XmlSchemaComplexType GetTypedTableSchema(XmlSchemaSet xs)
		{
			XmlSchemaComplexType xmlSchemaComplexType = new XmlSchemaComplexType();
			XmlSchemaSequence xmlSchemaSequence = new XmlSchemaSequence();
			UIDataSet uIDataSet = new UIDataSet();
			XmlSchemaAny xmlSchemaAny = new XmlSchemaAny();
			xmlSchemaAny.Namespace = "http://www.w3.org/2001/XMLSchema";
			xmlSchemaAny.MinOccurs = 0m;
			xmlSchemaAny.MaxOccurs = decimal.MaxValue;
			xmlSchemaAny.ProcessContents = XmlSchemaContentProcessing.Lax;
			xmlSchemaSequence.Items.Add(xmlSchemaAny);
			XmlSchemaAny xmlSchemaAny2 = new XmlSchemaAny();
			xmlSchemaAny2.Namespace = "urn:schemas-microsoft-com:xml-diffgram-v1";
			xmlSchemaAny2.MinOccurs = 1m;
			xmlSchemaAny2.ProcessContents = XmlSchemaContentProcessing.Lax;
			xmlSchemaSequence.Items.Add(xmlSchemaAny2);
			XmlSchemaAttribute xmlSchemaAttribute = new XmlSchemaAttribute();
			xmlSchemaAttribute.Name = "namespace";
			xmlSchemaAttribute.FixedValue = uIDataSet.Namespace;
			xmlSchemaComplexType.Attributes.Add(xmlSchemaAttribute);
			XmlSchemaAttribute xmlSchemaAttribute2 = new XmlSchemaAttribute();
			xmlSchemaAttribute2.Name = "tableTypeName";
			xmlSchemaAttribute2.FixedValue = "LangDataTable";
			xmlSchemaComplexType.Attributes.Add(xmlSchemaAttribute2);
			xmlSchemaComplexType.Particle = xmlSchemaSequence;
			XmlSchema schemaSerializable = uIDataSet.GetSchemaSerializable();
			if (xs.Contains(schemaSerializable.TargetNamespace))
			{
				MemoryStream memoryStream = new MemoryStream();
				MemoryStream memoryStream2 = new MemoryStream();
				try
				{
					XmlSchema xmlSchema = null;
					schemaSerializable.Write(memoryStream);
					IEnumerator enumerator = xs.Schemas(schemaSerializable.TargetNamespace).GetEnumerator();
					while (enumerator.MoveNext())
					{
						xmlSchema = (XmlSchema)enumerator.Current;
						memoryStream2.SetLength(0L);
						xmlSchema.Write(memoryStream2);
						if (memoryStream.Length == memoryStream2.Length)
						{
							memoryStream.Position = 0L;
							memoryStream2.Position = 0L;
							while (memoryStream.Position != memoryStream.Length && memoryStream.ReadByte() == memoryStream2.ReadByte())
							{
							}
							if (memoryStream.Position == memoryStream.Length)
							{
								return xmlSchemaComplexType;
							}
						}
					}
				}
				finally
				{
					memoryStream?.Close();
					memoryStream2?.Close();
				}
			}
			xs.Add(schemaSerializable);
			return xmlSchemaComplexType;
		}
	}

	[Serializable]
	[XmlSchemaProvider("GetTypedTableSchema")]
	public class PTCDataTable : DataTable, IEnumerable
	{
		private DataColumn columnID;

		private DataColumn columnCMD1;

		private DataColumn columnDisplay1;

		private DataColumn columnCMD2;

		private DataColumn columnDisplay2;

		private DataColumn columnCMD3;

		private DataColumn columnDisplay3;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public DataColumn IDColumn => columnID;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public DataColumn CMD1Column => columnCMD1;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public DataColumn Display1Column => columnDisplay1;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public DataColumn CMD2Column => columnCMD2;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public DataColumn Display2Column => columnDisplay2;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public DataColumn CMD3Column => columnCMD3;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public DataColumn Display3Column => columnDisplay3;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[Browsable(false)]
		public int Count => base.Rows.Count;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public PTCRow this[int index] => (PTCRow)base.Rows[index];

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public event PTCRowChangeEventHandler PTCRowChanging;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public event PTCRowChangeEventHandler PTCRowChanged;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public event PTCRowChangeEventHandler PTCRowDeleting;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public event PTCRowChangeEventHandler PTCRowDeleted;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public PTCDataTable()
		{
			base.TableName = "PTC";
			BeginInit();
			InitClass();
			EndInit();
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		internal PTCDataTable(DataTable table)
		{
			base.TableName = table.TableName;
			if (table.CaseSensitive != table.DataSet.CaseSensitive)
			{
				base.CaseSensitive = table.CaseSensitive;
			}
			if (table.Locale.ToString() != table.DataSet.Locale.ToString())
			{
				base.Locale = table.Locale;
			}
			if (table.Namespace != table.DataSet.Namespace)
			{
				base.Namespace = table.Namespace;
			}
			base.Prefix = table.Prefix;
			base.MinimumCapacity = table.MinimumCapacity;
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		protected PTCDataTable(SerializationInfo info, StreamingContext context)
			: base(info, context)
		{
			InitVars();
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public void AddPTCRow(PTCRow row)
		{
			base.Rows.Add(row);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public PTCRow AddPTCRow(string CMD1, string Display1, string CMD2, string Display2, string CMD3, string Display3)
		{
			PTCRow pTCRow = (PTCRow)NewRow();
			object[] itemArray = new object[7] { null, CMD1, Display1, CMD2, Display2, CMD3, Display3 };
			pTCRow.ItemArray = itemArray;
			base.Rows.Add(pTCRow);
			return pTCRow;
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public PTCRow FindByID(int ID)
		{
			return (PTCRow)base.Rows.Find(new object[1] { ID });
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public virtual IEnumerator GetEnumerator()
		{
			return base.Rows.GetEnumerator();
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public override DataTable Clone()
		{
			PTCDataTable pTCDataTable = (PTCDataTable)base.Clone();
			pTCDataTable.InitVars();
			return pTCDataTable;
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		protected override DataTable CreateInstance()
		{
			return new PTCDataTable();
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		internal void InitVars()
		{
			columnID = base.Columns["ID"];
			columnCMD1 = base.Columns["CMD1"];
			columnDisplay1 = base.Columns["Display1"];
			columnCMD2 = base.Columns["CMD2"];
			columnDisplay2 = base.Columns["Display2"];
			columnCMD3 = base.Columns["CMD3"];
			columnDisplay3 = base.Columns["Display3"];
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		private void InitClass()
		{
			columnID = new DataColumn("ID", typeof(int), null, MappingType.Element);
			base.Columns.Add(columnID);
			columnCMD1 = new DataColumn("CMD1", typeof(string), null, MappingType.Element);
			base.Columns.Add(columnCMD1);
			columnDisplay1 = new DataColumn("Display1", typeof(string), null, MappingType.Element);
			base.Columns.Add(columnDisplay1);
			columnCMD2 = new DataColumn("CMD2", typeof(string), null, MappingType.Element);
			base.Columns.Add(columnCMD2);
			columnDisplay2 = new DataColumn("Display2", typeof(string), null, MappingType.Element);
			base.Columns.Add(columnDisplay2);
			columnCMD3 = new DataColumn("CMD3", typeof(string), null, MappingType.Element);
			base.Columns.Add(columnCMD3);
			columnDisplay3 = new DataColumn("Display3", typeof(string), null, MappingType.Element);
			base.Columns.Add(columnDisplay3);
			base.Constraints.Add(new UniqueConstraint("Constraint1", new DataColumn[1] { columnID }, isPrimaryKey: true));
			columnID.AutoIncrement = true;
			columnID.AutoIncrementSeed = 1L;
			columnID.AllowDBNull = false;
			columnID.Unique = true;
			columnCMD1.AllowDBNull = false;
			columnCMD1.DefaultValue = "";
			columnDisplay1.AllowDBNull = false;
			columnDisplay1.DefaultValue = "";
			columnCMD2.AllowDBNull = false;
			columnCMD2.DefaultValue = "";
			columnDisplay2.AllowDBNull = false;
			columnDisplay2.DefaultValue = "";
			columnCMD3.AllowDBNull = false;
			columnCMD3.DefaultValue = "";
			columnDisplay3.AllowDBNull = false;
			columnDisplay3.DefaultValue = "";
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public PTCRow NewPTCRow()
		{
			return (PTCRow)NewRow();
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		protected override DataRow NewRowFromBuilder(DataRowBuilder builder)
		{
			return new PTCRow(builder);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		protected override Type GetRowType()
		{
			return typeof(PTCRow);
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		protected override void OnRowChanged(DataRowChangeEventArgs e)
		{
			base.OnRowChanged(e);
			if (this.PTCRowChanged != null)
			{
				this.PTCRowChanged(this, new PTCRowChangeEvent((PTCRow)e.Row, e.Action));
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		protected override void OnRowChanging(DataRowChangeEventArgs e)
		{
			base.OnRowChanging(e);
			if (this.PTCRowChanging != null)
			{
				this.PTCRowChanging(this, new PTCRowChangeEvent((PTCRow)e.Row, e.Action));
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		protected override void OnRowDeleted(DataRowChangeEventArgs e)
		{
			base.OnRowDeleted(e);
			if (this.PTCRowDeleted != null)
			{
				this.PTCRowDeleted(this, new PTCRowChangeEvent((PTCRow)e.Row, e.Action));
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		protected override void OnRowDeleting(DataRowChangeEventArgs e)
		{
			base.OnRowDeleting(e);
			if (this.PTCRowDeleting != null)
			{
				this.PTCRowDeleting(this, new PTCRowChangeEvent((PTCRow)e.Row, e.Action));
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public void RemovePTCRow(PTCRow row)
		{
			base.Rows.Remove(row);
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public static XmlSchemaComplexType GetTypedTableSchema(XmlSchemaSet xs)
		{
			XmlSchemaComplexType xmlSchemaComplexType = new XmlSchemaComplexType();
			XmlSchemaSequence xmlSchemaSequence = new XmlSchemaSequence();
			UIDataSet uIDataSet = new UIDataSet();
			XmlSchemaAny xmlSchemaAny = new XmlSchemaAny();
			xmlSchemaAny.Namespace = "http://www.w3.org/2001/XMLSchema";
			xmlSchemaAny.MinOccurs = 0m;
			xmlSchemaAny.MaxOccurs = decimal.MaxValue;
			xmlSchemaAny.ProcessContents = XmlSchemaContentProcessing.Lax;
			xmlSchemaSequence.Items.Add(xmlSchemaAny);
			XmlSchemaAny xmlSchemaAny2 = new XmlSchemaAny();
			xmlSchemaAny2.Namespace = "urn:schemas-microsoft-com:xml-diffgram-v1";
			xmlSchemaAny2.MinOccurs = 1m;
			xmlSchemaAny2.ProcessContents = XmlSchemaContentProcessing.Lax;
			xmlSchemaSequence.Items.Add(xmlSchemaAny2);
			XmlSchemaAttribute xmlSchemaAttribute = new XmlSchemaAttribute();
			xmlSchemaAttribute.Name = "namespace";
			xmlSchemaAttribute.FixedValue = uIDataSet.Namespace;
			xmlSchemaComplexType.Attributes.Add(xmlSchemaAttribute);
			XmlSchemaAttribute xmlSchemaAttribute2 = new XmlSchemaAttribute();
			xmlSchemaAttribute2.Name = "tableTypeName";
			xmlSchemaAttribute2.FixedValue = "PTCDataTable";
			xmlSchemaComplexType.Attributes.Add(xmlSchemaAttribute2);
			xmlSchemaComplexType.Particle = xmlSchemaSequence;
			XmlSchema schemaSerializable = uIDataSet.GetSchemaSerializable();
			if (xs.Contains(schemaSerializable.TargetNamespace))
			{
				MemoryStream memoryStream = new MemoryStream();
				MemoryStream memoryStream2 = new MemoryStream();
				try
				{
					XmlSchema xmlSchema = null;
					schemaSerializable.Write(memoryStream);
					IEnumerator enumerator = xs.Schemas(schemaSerializable.TargetNamespace).GetEnumerator();
					while (enumerator.MoveNext())
					{
						xmlSchema = (XmlSchema)enumerator.Current;
						memoryStream2.SetLength(0L);
						xmlSchema.Write(memoryStream2);
						if (memoryStream.Length == memoryStream2.Length)
						{
							memoryStream.Position = 0L;
							memoryStream2.Position = 0L;
							while (memoryStream.Position != memoryStream.Length && memoryStream.ReadByte() == memoryStream2.ReadByte())
							{
							}
							if (memoryStream.Position == memoryStream.Length)
							{
								return xmlSchemaComplexType;
							}
						}
					}
				}
				finally
				{
					memoryStream?.Close();
					memoryStream2?.Close();
				}
			}
			xs.Add(schemaSerializable);
			return xmlSchemaComplexType;
		}
	}

	[Serializable]
	[XmlSchemaProvider("GetTypedTableSchema")]
	public class FileTask_ContentDataTable : DataTable, IEnumerable
	{
		private DataColumn columnCommand;

		private DataColumn columnDisplay;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public DataColumn CommandColumn => columnCommand;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public DataColumn DisplayColumn => columnDisplay;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		[Browsable(false)]
		public int Count => base.Rows.Count;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public FileTask_ContentRow this[int index] => (FileTask_ContentRow)base.Rows[index];

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public event FileTask_ContentRowChangeEventHandler FileTask_ContentRowChanging;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public event FileTask_ContentRowChangeEventHandler FileTask_ContentRowChanged;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public event FileTask_ContentRowChangeEventHandler FileTask_ContentRowDeleting;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public event FileTask_ContentRowChangeEventHandler FileTask_ContentRowDeleted;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public FileTask_ContentDataTable()
		{
			base.TableName = "FileTask_Content";
			BeginInit();
			InitClass();
			EndInit();
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		internal FileTask_ContentDataTable(DataTable table)
		{
			base.TableName = table.TableName;
			if (table.CaseSensitive != table.DataSet.CaseSensitive)
			{
				base.CaseSensitive = table.CaseSensitive;
			}
			if (table.Locale.ToString() != table.DataSet.Locale.ToString())
			{
				base.Locale = table.Locale;
			}
			if (table.Namespace != table.DataSet.Namespace)
			{
				base.Namespace = table.Namespace;
			}
			base.Prefix = table.Prefix;
			base.MinimumCapacity = table.MinimumCapacity;
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		protected FileTask_ContentDataTable(SerializationInfo info, StreamingContext context)
			: base(info, context)
		{
			InitVars();
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public void AddFileTask_ContentRow(FileTask_ContentRow row)
		{
			base.Rows.Add(row);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public FileTask_ContentRow AddFileTask_ContentRow(string Command, string Display)
		{
			FileTask_ContentRow fileTask_ContentRow = (FileTask_ContentRow)NewRow();
			object[] itemArray = new object[2] { Command, Display };
			fileTask_ContentRow.ItemArray = itemArray;
			base.Rows.Add(fileTask_ContentRow);
			return fileTask_ContentRow;
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public FileTask_ContentRow FindByCommand(string Command)
		{
			return (FileTask_ContentRow)base.Rows.Find(new object[1] { Command });
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public virtual IEnumerator GetEnumerator()
		{
			return base.Rows.GetEnumerator();
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public override DataTable Clone()
		{
			FileTask_ContentDataTable fileTask_ContentDataTable = (FileTask_ContentDataTable)base.Clone();
			fileTask_ContentDataTable.InitVars();
			return fileTask_ContentDataTable;
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		protected override DataTable CreateInstance()
		{
			return new FileTask_ContentDataTable();
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		internal void InitVars()
		{
			columnCommand = base.Columns["Command"];
			columnDisplay = base.Columns["Display"];
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		private void InitClass()
		{
			columnCommand = new DataColumn("Command", typeof(string), null, MappingType.Element);
			base.Columns.Add(columnCommand);
			columnDisplay = new DataColumn("Display", typeof(string), null, MappingType.Element);
			base.Columns.Add(columnDisplay);
			base.Constraints.Add(new UniqueConstraint("Constraint1", new DataColumn[1] { columnCommand }, isPrimaryKey: true));
			columnCommand.AllowDBNull = false;
			columnCommand.Unique = true;
			columnCommand.Caption = "Display";
			columnDisplay.AllowDBNull = false;
			columnDisplay.Caption = "Format_Init";
			columnDisplay.DefaultValue = "";
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public FileTask_ContentRow NewFileTask_ContentRow()
		{
			return (FileTask_ContentRow)NewRow();
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		protected override DataRow NewRowFromBuilder(DataRowBuilder builder)
		{
			return new FileTask_ContentRow(builder);
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		protected override Type GetRowType()
		{
			return typeof(FileTask_ContentRow);
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		protected override void OnRowChanged(DataRowChangeEventArgs e)
		{
			base.OnRowChanged(e);
			if (this.FileTask_ContentRowChanged != null)
			{
				this.FileTask_ContentRowChanged(this, new FileTask_ContentRowChangeEvent((FileTask_ContentRow)e.Row, e.Action));
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		protected override void OnRowChanging(DataRowChangeEventArgs e)
		{
			base.OnRowChanging(e);
			if (this.FileTask_ContentRowChanging != null)
			{
				this.FileTask_ContentRowChanging(this, new FileTask_ContentRowChangeEvent((FileTask_ContentRow)e.Row, e.Action));
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		protected override void OnRowDeleted(DataRowChangeEventArgs e)
		{
			base.OnRowDeleted(e);
			if (this.FileTask_ContentRowDeleted != null)
			{
				this.FileTask_ContentRowDeleted(this, new FileTask_ContentRowChangeEvent((FileTask_ContentRow)e.Row, e.Action));
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		protected override void OnRowDeleting(DataRowChangeEventArgs e)
		{
			base.OnRowDeleting(e);
			if (this.FileTask_ContentRowDeleting != null)
			{
				this.FileTask_ContentRowDeleting(this, new FileTask_ContentRowChangeEvent((FileTask_ContentRow)e.Row, e.Action));
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public void RemoveFileTask_ContentRow(FileTask_ContentRow row)
		{
			base.Rows.Remove(row);
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public static XmlSchemaComplexType GetTypedTableSchema(XmlSchemaSet xs)
		{
			XmlSchemaComplexType xmlSchemaComplexType = new XmlSchemaComplexType();
			XmlSchemaSequence xmlSchemaSequence = new XmlSchemaSequence();
			UIDataSet uIDataSet = new UIDataSet();
			XmlSchemaAny xmlSchemaAny = new XmlSchemaAny();
			xmlSchemaAny.Namespace = "http://www.w3.org/2001/XMLSchema";
			xmlSchemaAny.MinOccurs = 0m;
			xmlSchemaAny.MaxOccurs = decimal.MaxValue;
			xmlSchemaAny.ProcessContents = XmlSchemaContentProcessing.Lax;
			xmlSchemaSequence.Items.Add(xmlSchemaAny);
			XmlSchemaAny xmlSchemaAny2 = new XmlSchemaAny();
			xmlSchemaAny2.Namespace = "urn:schemas-microsoft-com:xml-diffgram-v1";
			xmlSchemaAny2.MinOccurs = 1m;
			xmlSchemaAny2.ProcessContents = XmlSchemaContentProcessing.Lax;
			xmlSchemaSequence.Items.Add(xmlSchemaAny2);
			XmlSchemaAttribute xmlSchemaAttribute = new XmlSchemaAttribute();
			xmlSchemaAttribute.Name = "namespace";
			xmlSchemaAttribute.FixedValue = uIDataSet.Namespace;
			xmlSchemaComplexType.Attributes.Add(xmlSchemaAttribute);
			XmlSchemaAttribute xmlSchemaAttribute2 = new XmlSchemaAttribute();
			xmlSchemaAttribute2.Name = "tableTypeName";
			xmlSchemaAttribute2.FixedValue = "FileTask_ContentDataTable";
			xmlSchemaComplexType.Attributes.Add(xmlSchemaAttribute2);
			xmlSchemaComplexType.Particle = xmlSchemaSequence;
			XmlSchema schemaSerializable = uIDataSet.GetSchemaSerializable();
			if (xs.Contains(schemaSerializable.TargetNamespace))
			{
				MemoryStream memoryStream = new MemoryStream();
				MemoryStream memoryStream2 = new MemoryStream();
				try
				{
					XmlSchema xmlSchema = null;
					schemaSerializable.Write(memoryStream);
					IEnumerator enumerator = xs.Schemas(schemaSerializable.TargetNamespace).GetEnumerator();
					while (enumerator.MoveNext())
					{
						xmlSchema = (XmlSchema)enumerator.Current;
						memoryStream2.SetLength(0L);
						xmlSchema.Write(memoryStream2);
						if (memoryStream.Length == memoryStream2.Length)
						{
							memoryStream.Position = 0L;
							memoryStream2.Position = 0L;
							while (memoryStream.Position != memoryStream.Length && memoryStream.ReadByte() == memoryStream2.ReadByte())
							{
							}
							if (memoryStream.Position == memoryStream.Length)
							{
								return xmlSchemaComplexType;
							}
						}
					}
				}
				finally
				{
					memoryStream?.Close();
					memoryStream2?.Close();
				}
			}
			xs.Add(schemaSerializable);
			return xmlSchemaComplexType;
		}
	}

	public class PLU_PS_DateRow : DataRow
	{
		private PLU_PS_DateDataTable tablePLU_PS_Date;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public int Value
		{
			get
			{
				return (int)base[tablePLU_PS_Date.ValueColumn];
			}
			set
			{
				base[tablePLU_PS_Date.ValueColumn] = value;
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public string Display
		{
			get
			{
				return (string)base[tablePLU_PS_Date.DisplayColumn];
			}
			set
			{
				base[tablePLU_PS_Date.DisplayColumn] = value;
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		internal PLU_PS_DateRow(DataRowBuilder rb)
			: base(rb)
		{
			tablePLU_PS_Date = (PLU_PS_DateDataTable)base.Table;
		}
	}

	public class PLU_PS_TimeRow : DataRow
	{
		private PLU_PS_TimeDataTable tablePLU_PS_Time;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public int Value
		{
			get
			{
				return (int)base[tablePLU_PS_Time.ValueColumn];
			}
			set
			{
				base[tablePLU_PS_Time.ValueColumn] = value;
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public string Display
		{
			get
			{
				return (string)base[tablePLU_PS_Time.DisplayColumn];
			}
			set
			{
				base[tablePLU_PS_Time.DisplayColumn] = value;
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		internal PLU_PS_TimeRow(DataRowBuilder rb)
			: base(rb)
		{
			tablePLU_PS_Time = (PLU_PS_TimeDataTable)base.Table;
		}
	}

	public class LabelItem_PrintRow : DataRow
	{
		private LabelItem_PrintDataTable tableLabelItem_Print;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public int Value
		{
			get
			{
				return (int)base[tableLabelItem_Print.ValueColumn];
			}
			set
			{
				base[tableLabelItem_Print.ValueColumn] = value;
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public string Display
		{
			get
			{
				return (string)base[tableLabelItem_Print.DisplayColumn];
			}
			set
			{
				base[tableLabelItem_Print.DisplayColumn] = value;
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		internal LabelItem_PrintRow(DataRowBuilder rb)
			: base(rb)
		{
			tableLabelItem_Print = (LabelItem_PrintDataTable)base.Table;
		}
	}

	public class LabelItem_AngleRow : DataRow
	{
		private LabelItem_AngleDataTable tableLabelItem_Angle;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public int Value
		{
			get
			{
				return (int)base[tableLabelItem_Angle.ValueColumn];
			}
			set
			{
				base[tableLabelItem_Angle.ValueColumn] = value;
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public string Display
		{
			get
			{
				return (string)base[tableLabelItem_Angle.DisplayColumn];
			}
			set
			{
				base[tableLabelItem_Angle.DisplayColumn] = value;
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		internal LabelItem_AngleRow(DataRowBuilder rb)
			: base(rb)
		{
			tableLabelItem_Angle = (LabelItem_AngleDataTable)base.Table;
		}
	}

	public class LabelItem_Font1Row : DataRow
	{
		private LabelItem_Font1DataTable tableLabelItem_Font1;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public int Value
		{
			get
			{
				return (int)base[tableLabelItem_Font1.ValueColumn];
			}
			set
			{
				base[tableLabelItem_Font1.ValueColumn] = value;
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public string Display
		{
			get
			{
				return (string)base[tableLabelItem_Font1.DisplayColumn];
			}
			set
			{
				base[tableLabelItem_Font1.DisplayColumn] = value;
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public int Size
		{
			get
			{
				return (int)base[tableLabelItem_Font1.SizeColumn];
			}
			set
			{
				base[tableLabelItem_Font1.SizeColumn] = value;
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		internal LabelItem_Font1Row(DataRowBuilder rb)
			: base(rb)
		{
			tableLabelItem_Font1 = (LabelItem_Font1DataTable)base.Table;
		}
	}

	public class LabelItem_AlignRow : DataRow
	{
		private LabelItem_AlignDataTable tableLabelItem_Align;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public int Value
		{
			get
			{
				return (int)base[tableLabelItem_Align.ValueColumn];
			}
			set
			{
				base[tableLabelItem_Align.ValueColumn] = value;
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public string Display
		{
			get
			{
				return (string)base[tableLabelItem_Align.DisplayColumn];
			}
			set
			{
				base[tableLabelItem_Align.DisplayColumn] = value;
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		internal LabelItem_AlignRow(DataRowBuilder rb)
			: base(rb)
		{
			tableLabelItem_Align = (LabelItem_AlignDataTable)base.Table;
		}
	}

	public class Barcode_SourceRow : DataRow
	{
		private Barcode_SourceDataTable tableBarcode_Source;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public int Value
		{
			get
			{
				return (int)base[tableBarcode_Source.ValueColumn];
			}
			set
			{
				base[tableBarcode_Source.ValueColumn] = value;
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public string Display
		{
			get
			{
				return (string)base[tableBarcode_Source.DisplayColumn];
			}
			set
			{
				base[tableBarcode_Source.DisplayColumn] = value;
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		internal Barcode_SourceRow(DataRowBuilder rb)
			: base(rb)
		{
			tableBarcode_Source = (Barcode_SourceDataTable)base.Table;
		}
	}

	public class Barcode_OverRow : DataRow
	{
		private Barcode_OverDataTable tableBarcode_Over;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public int Value
		{
			get
			{
				return (int)base[tableBarcode_Over.ValueColumn];
			}
			set
			{
				base[tableBarcode_Over.ValueColumn] = value;
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public string Display
		{
			get
			{
				return (string)base[tableBarcode_Over.DisplayColumn];
			}
			set
			{
				base[tableBarcode_Over.DisplayColumn] = value;
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		internal Barcode_OverRow(DataRowBuilder rb)
			: base(rb)
		{
			tableBarcode_Over = (Barcode_OverDataTable)base.Table;
		}
	}

	public class Barcode_FormatRow : DataRow
	{
		private Barcode_FormatDataTable tableBarcode_Format;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public int Value
		{
			get
			{
				return (int)base[tableBarcode_Format.ValueColumn];
			}
			set
			{
				base[tableBarcode_Format.ValueColumn] = value;
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public string Display
		{
			get
			{
				return (string)base[tableBarcode_Format.DisplayColumn];
			}
			set
			{
				base[tableBarcode_Format.DisplayColumn] = value;
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		internal Barcode_FormatRow(DataRowBuilder rb)
			: base(rb)
		{
			tableBarcode_Format = (Barcode_FormatDataTable)base.Table;
		}
	}

	public class Barcode_CheckRow : DataRow
	{
		private Barcode_CheckDataTable tableBarcode_Check;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public int Value
		{
			get
			{
				return (int)base[tableBarcode_Check.ValueColumn];
			}
			set
			{
				base[tableBarcode_Check.ValueColumn] = value;
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public string Display
		{
			get
			{
				return (string)base[tableBarcode_Check.DisplayColumn];
			}
			set
			{
				base[tableBarcode_Check.DisplayColumn] = value;
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		internal Barcode_CheckRow(DataRowBuilder rb)
			: base(rb)
		{
			tableBarcode_Check = (Barcode_CheckDataTable)base.Table;
		}
	}

	public class Label_SortRow : DataRow
	{
		private Label_SortDataTable tableLabel_Sort;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public int Value
		{
			get
			{
				return (int)base[tableLabel_Sort.ValueColumn];
			}
			set
			{
				base[tableLabel_Sort.ValueColumn] = value;
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public string Display
		{
			get
			{
				return (string)base[tableLabel_Sort.DisplayColumn];
			}
			set
			{
				base[tableLabel_Sort.DisplayColumn] = value;
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		internal Label_SortRow(DataRowBuilder rb)
			: base(rb)
		{
			tableLabel_Sort = (Label_SortDataTable)base.Table;
		}
	}

	public class String_InfoRow : DataRow
	{
		private String_InfoDataTable tableString_Info;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public int StringID
		{
			get
			{
				return (int)base[tableString_Info.StringIDColumn];
			}
			set
			{
				base[tableString_Info.StringIDColumn] = value;
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public string Display
		{
			get
			{
				return (string)base[tableString_Info.DisplayColumn];
			}
			set
			{
				base[tableString_Info.DisplayColumn] = value;
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public string Visible
		{
			get
			{
				return (string)base[tableString_Info.VisibleColumn];
			}
			set
			{
				base[tableString_Info.VisibleColumn] = value;
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		internal String_InfoRow(DataRowBuilder rb)
			: base(rb)
		{
			tableString_Info = (String_InfoDataTable)base.Table;
		}
	}

	public class Spec_InfoRow : DataRow
	{
		private Spec_InfoDataTable tableSpec_Info;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public int SpecID
		{
			get
			{
				return (int)base[tableSpec_Info.SpecIDColumn];
			}
			set
			{
				base[tableSpec_Info.SpecIDColumn] = value;
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public int Type
		{
			get
			{
				return (int)base[tableSpec_Info.TypeColumn];
			}
			set
			{
				base[tableSpec_Info.TypeColumn] = value;
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public string Display
		{
			get
			{
				return (string)base[tableSpec_Info.DisplayColumn];
			}
			set
			{
				base[tableSpec_Info.DisplayColumn] = value;
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public string Visible
		{
			get
			{
				return (string)base[tableSpec_Info.VisibleColumn];
			}
			set
			{
				base[tableSpec_Info.VisibleColumn] = value;
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		internal Spec_InfoRow(DataRowBuilder rb)
			: base(rb)
		{
			tableSpec_Info = (Spec_InfoDataTable)base.Table;
		}
	}

	public class PLU_DF_URow : DataRow
	{
		private PLU_DF_UDataTable tablePLU_DF_U;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public int Value
		{
			get
			{
				return (int)base[tablePLU_DF_U.ValueColumn];
			}
			set
			{
				base[tablePLU_DF_U.ValueColumn] = value;
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public string Display
		{
			get
			{
				return (string)base[tablePLU_DF_U.DisplayColumn];
			}
			set
			{
				base[tablePLU_DF_U.DisplayColumn] = value;
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		internal PLU_DF_URow(DataRowBuilder rb)
			: base(rb)
		{
			tablePLU_DF_U = (PLU_DF_UDataTable)base.Table;
		}
	}

	public class PLU_DF_DRow : DataRow
	{
		private PLU_DF_DDataTable tablePLU_DF_D;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public int Value
		{
			get
			{
				return (int)base[tablePLU_DF_D.ValueColumn];
			}
			set
			{
				base[tablePLU_DF_D.ValueColumn] = value;
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public string Display
		{
			get
			{
				return (string)base[tablePLU_DF_D.DisplayColumn];
			}
			set
			{
				base[tablePLU_DF_D.DisplayColumn] = value;
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		internal PLU_DF_DRow(DataRowBuilder rb)
			: base(rb)
		{
			tablePLU_DF_D = (PLU_DF_DDataTable)base.Table;
		}
	}

	public class PLU_DA_SortRow : DataRow
	{
		private PLU_DA_SortDataTable tablePLU_DA_Sort;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public int Value
		{
			get
			{
				return (int)base[tablePLU_DA_Sort.ValueColumn];
			}
			set
			{
				base[tablePLU_DA_Sort.ValueColumn] = value;
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public string Display
		{
			get
			{
				return (string)base[tablePLU_DA_Sort.DisplayColumn];
			}
			set
			{
				base[tablePLU_DA_Sort.DisplayColumn] = value;
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		internal PLU_DA_SortRow(DataRowBuilder rb)
			: base(rb)
		{
			tablePLU_DA_Sort = (PLU_DA_SortDataTable)base.Table;
		}
	}

	public class LabelItem_Flag1Row : DataRow
	{
		private LabelItem_Flag1DataTable tableLabelItem_Flag1;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public int Flag1
		{
			get
			{
				return (int)base[tableLabelItem_Flag1.Flag1Column];
			}
			set
			{
				base[tableLabelItem_Flag1.Flag1Column] = value;
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public string Display
		{
			get
			{
				return (string)base[tableLabelItem_Flag1.DisplayColumn];
			}
			set
			{
				base[tableLabelItem_Flag1.DisplayColumn] = value;
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		internal LabelItem_Flag1Row(DataRowBuilder rb)
			: base(rb)
		{
			tableLabelItem_Flag1 = (LabelItem_Flag1DataTable)base.Table;
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public LabelItem_Flag2Row[] GetLabelItem_Flag2Rows()
		{
			if (base.Table.ChildRelations["LabelItem_Flag1_LabelItem_Flag2"] == null)
			{
				return new LabelItem_Flag2Row[0];
			}
			return (LabelItem_Flag2Row[])GetChildRows(base.Table.ChildRelations["LabelItem_Flag1_LabelItem_Flag2"]);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public LabelItem_Flag3Row[] GetLabelItem_Flag3Rows()
		{
			if (base.Table.ChildRelations["LabelItem_Flag1_LabelItem_Flag3"] == null)
			{
				return new LabelItem_Flag3Row[0];
			}
			return (LabelItem_Flag3Row[])GetChildRows(base.Table.ChildRelations["LabelItem_Flag1_LabelItem_Flag3"]);
		}
	}

	public class LabelItem_Flag2Row : DataRow
	{
		private LabelItem_Flag2DataTable tableLabelItem_Flag2;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public int Flag1
		{
			get
			{
				return (int)base[tableLabelItem_Flag2.Flag1Column];
			}
			set
			{
				base[tableLabelItem_Flag2.Flag1Column] = value;
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public int Flag2
		{
			get
			{
				return (int)base[tableLabelItem_Flag2.Flag2Column];
			}
			set
			{
				base[tableLabelItem_Flag2.Flag2Column] = value;
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public string Display
		{
			get
			{
				return (string)base[tableLabelItem_Flag2.DisplayColumn];
			}
			set
			{
				base[tableLabelItem_Flag2.DisplayColumn] = value;
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public LabelItem_Flag1Row LabelItem_Flag1Row
		{
			get
			{
				return (LabelItem_Flag1Row)GetParentRow(base.Table.ParentRelations["LabelItem_Flag1_LabelItem_Flag2"]);
			}
			set
			{
				SetParentRow(value, base.Table.ParentRelations["LabelItem_Flag1_LabelItem_Flag2"]);
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		internal LabelItem_Flag2Row(DataRowBuilder rb)
			: base(rb)
		{
			tableLabelItem_Flag2 = (LabelItem_Flag2DataTable)base.Table;
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public LabelItem_Flag4Row[] GetLabelItem_Flag4Rows()
		{
			if (base.Table.ChildRelations["LabelItem_Flag2_LabelItem_Flag4"] == null)
			{
				return new LabelItem_Flag4Row[0];
			}
			return (LabelItem_Flag4Row[])GetChildRows(base.Table.ChildRelations["LabelItem_Flag2_LabelItem_Flag4"]);
		}
	}

	public class LabelItem_Flag4Row : DataRow
	{
		private LabelItem_Flag4DataTable tableLabelItem_Flag4;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public int Flag1
		{
			get
			{
				return (int)base[tableLabelItem_Flag4.Flag1Column];
			}
			set
			{
				base[tableLabelItem_Flag4.Flag1Column] = value;
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public int Flag2
		{
			get
			{
				return (int)base[tableLabelItem_Flag4.Flag2Column];
			}
			set
			{
				base[tableLabelItem_Flag4.Flag2Column] = value;
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public int Flag4
		{
			get
			{
				return (int)base[tableLabelItem_Flag4.Flag4Column];
			}
			set
			{
				base[tableLabelItem_Flag4.Flag4Column] = value;
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public string Display
		{
			get
			{
				return (string)base[tableLabelItem_Flag4.DisplayColumn];
			}
			set
			{
				base[tableLabelItem_Flag4.DisplayColumn] = value;
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public LabelItem_Flag2Row LabelItem_Flag2RowParent
		{
			get
			{
				return (LabelItem_Flag2Row)GetParentRow(base.Table.ParentRelations["LabelItem_Flag2_LabelItem_Flag4"]);
			}
			set
			{
				SetParentRow(value, base.Table.ParentRelations["LabelItem_Flag2_LabelItem_Flag4"]);
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		internal LabelItem_Flag4Row(DataRowBuilder rb)
			: base(rb)
		{
			tableLabelItem_Flag4 = (LabelItem_Flag4DataTable)base.Table;
		}
	}

	public class LabelItem_Flag3Row : DataRow
	{
		private LabelItem_Flag3DataTable tableLabelItem_Flag3;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public int Flag1
		{
			get
			{
				return (int)base[tableLabelItem_Flag3.Flag1Column];
			}
			set
			{
				base[tableLabelItem_Flag3.Flag1Column] = value;
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public int Flag3
		{
			get
			{
				return (int)base[tableLabelItem_Flag3.Flag3Column];
			}
			set
			{
				base[tableLabelItem_Flag3.Flag3Column] = value;
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public string Display
		{
			get
			{
				return (string)base[tableLabelItem_Flag3.DisplayColumn];
			}
			set
			{
				base[tableLabelItem_Flag3.DisplayColumn] = value;
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public LabelItem_Flag1Row LabelItem_Flag1Row
		{
			get
			{
				return (LabelItem_Flag1Row)GetParentRow(base.Table.ParentRelations["LabelItem_Flag1_LabelItem_Flag3"]);
			}
			set
			{
				SetParentRow(value, base.Table.ParentRelations["LabelItem_Flag1_LabelItem_Flag3"]);
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		internal LabelItem_Flag3Row(DataRowBuilder rb)
			: base(rb)
		{
			tableLabelItem_Flag3 = (LabelItem_Flag3DataTable)base.Table;
		}
	}

	public class PLU_ColRow : DataRow
	{
		private PLU_ColDataTable tablePLU_Col;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public string Field
		{
			get
			{
				return (string)base[tablePLU_Col.FieldColumn];
			}
			set
			{
				base[tablePLU_Col.FieldColumn] = value;
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public string Display
		{
			get
			{
				return (string)base[tablePLU_Col.DisplayColumn];
			}
			set
			{
				base[tablePLU_Col.DisplayColumn] = value;
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		internal PLU_ColRow(DataRowBuilder rb)
			: base(rb)
		{
			tablePLU_Col = (PLU_ColDataTable)base.Table;
		}
	}

	public class ConfigRow : DataRow
	{
		private ConfigDataTable tableConfig;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public string Name
		{
			get
			{
				return (string)base[tableConfig.NameColumn];
			}
			set
			{
				base[tableConfig.NameColumn] = value;
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public string Folder
		{
			get
			{
				return (string)base[tableConfig.FolderColumn];
			}
			set
			{
				base[tableConfig.FolderColumn] = value;
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public string Lang
		{
			get
			{
				return (string)base[tableConfig.LangColumn];
			}
			set
			{
				base[tableConfig.LangColumn] = value;
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public string Encoding
		{
			get
			{
				try
				{
					return (string)base[tableConfig.EncodingColumn];
				}
				catch (InvalidCastException innerException)
				{
					throw new StrongTypingException("表“Config”中列“Encoding”的值为 DBNull。", innerException);
				}
			}
			set
			{
				base[tableConfig.EncodingColumn] = value;
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		internal ConfigRow(DataRowBuilder rb)
			: base(rb)
		{
			tableConfig = (ConfigDataTable)base.Table;
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public bool IsEncodingNull()
		{
			return IsNull(tableConfig.EncodingColumn);
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public void SetEncodingNull()
		{
			base[tableConfig.EncodingColumn] = Convert.DBNull;
		}
	}

	public class Unit_TypeRow : DataRow
	{
		private Unit_TypeDataTable tableUnit_Type;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public int Value
		{
			get
			{
				return (int)base[tableUnit_Type.ValueColumn];
			}
			set
			{
				base[tableUnit_Type.ValueColumn] = value;
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public string Display
		{
			get
			{
				return (string)base[tableUnit_Type.DisplayColumn];
			}
			set
			{
				base[tableUnit_Type.DisplayColumn] = value;
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		internal Unit_TypeRow(DataRowBuilder rb)
			: base(rb)
		{
			tableUnit_Type = (Unit_TypeDataTable)base.Table;
		}
	}

	public class LabelItem_Font2Row : DataRow
	{
		private LabelItem_Font2DataTable tableLabelItem_Font2;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public int Value
		{
			get
			{
				return (int)base[tableLabelItem_Font2.ValueColumn];
			}
			set
			{
				base[tableLabelItem_Font2.ValueColumn] = value;
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public string Display
		{
			get
			{
				return (string)base[tableLabelItem_Font2.DisplayColumn];
			}
			set
			{
				base[tableLabelItem_Font2.DisplayColumn] = value;
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public int Size
		{
			get
			{
				return (int)base[tableLabelItem_Font2.SizeColumn];
			}
			set
			{
				base[tableLabelItem_Font2.SizeColumn] = value;
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		internal LabelItem_Font2Row(DataRowBuilder rb)
			: base(rb)
		{
			tableLabelItem_Font2 = (LabelItem_Font2DataTable)base.Table;
		}
	}

	public class Label_VersionRow : DataRow
	{
		private Label_VersionDataTable tableLabel_Version;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public int Value
		{
			get
			{
				return (int)base[tableLabel_Version.ValueColumn];
			}
			set
			{
				base[tableLabel_Version.ValueColumn] = value;
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public string Display
		{
			get
			{
				return (string)base[tableLabel_Version.DisplayColumn];
			}
			set
			{
				base[tableLabel_Version.DisplayColumn] = value;
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		internal Label_VersionRow(DataRowBuilder rb)
			: base(rb)
		{
			tableLabel_Version = (Label_VersionDataTable)base.Table;
		}
	}

	public class PLU_TaxTypeRow : DataRow
	{
		private PLU_TaxTypeDataTable tablePLU_TaxType;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public int Value
		{
			get
			{
				return (int)base[tablePLU_TaxType.ValueColumn];
			}
			set
			{
				base[tablePLU_TaxType.ValueColumn] = value;
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public string Display
		{
			get
			{
				return (string)base[tablePLU_TaxType.DisplayColumn];
			}
			set
			{
				base[tablePLU_TaxType.DisplayColumn] = value;
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		internal PLU_TaxTypeRow(DataRowBuilder rb)
			: base(rb)
		{
			tablePLU_TaxType = (PLU_TaxTypeDataTable)base.Table;
		}
	}

	public class Report_ColRow : DataRow
	{
		private Report_ColDataTable tableReport_Col;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public string Field
		{
			get
			{
				return (string)base[tableReport_Col.FieldColumn];
			}
			set
			{
				base[tableReport_Col.FieldColumn] = value;
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public string Display
		{
			get
			{
				return (string)base[tableReport_Col.DisplayColumn];
			}
			set
			{
				base[tableReport_Col.DisplayColumn] = value;
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		internal Report_ColRow(DataRowBuilder rb)
			: base(rb)
		{
			tableReport_Col = (Report_ColDataTable)base.Table;
		}
	}

	public class Network_TaskRow : DataRow
	{
		private Network_TaskDataTable tableNetwork_Task;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public int Value
		{
			get
			{
				return (int)base[tableNetwork_Task.ValueColumn];
			}
			set
			{
				base[tableNetwork_Task.ValueColumn] = value;
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public string Display
		{
			get
			{
				return (string)base[tableNetwork_Task.DisplayColumn];
			}
			set
			{
				base[tableNetwork_Task.DisplayColumn] = value;
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		internal Network_TaskRow(DataRowBuilder rb)
			: base(rb)
		{
			tableNetwork_Task = (Network_TaskDataTable)base.Table;
		}
	}

	public class Network_DueRow : DataRow
	{
		private Network_DueDataTable tableNetwork_Due;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public int Value
		{
			get
			{
				return (int)base[tableNetwork_Due.ValueColumn];
			}
			set
			{
				base[tableNetwork_Due.ValueColumn] = value;
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public string Display
		{
			get
			{
				return (string)base[tableNetwork_Due.DisplayColumn];
			}
			set
			{
				base[tableNetwork_Due.DisplayColumn] = value;
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		internal Network_DueRow(DataRowBuilder rb)
			: base(rb)
		{
			tableNetwork_Due = (Network_DueDataTable)base.Table;
		}
	}

	public class Network_AutoRow : DataRow
	{
		private Network_AutoDataTable tableNetwork_Auto;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public int ID
		{
			get
			{
				return (int)base[tableNetwork_Auto.IDColumn];
			}
			set
			{
				base[tableNetwork_Auto.IDColumn] = value;
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public int Task
		{
			get
			{
				return (int)base[tableNetwork_Auto.TaskColumn];
			}
			set
			{
				base[tableNetwork_Auto.TaskColumn] = value;
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public int Due
		{
			get
			{
				return (int)base[tableNetwork_Auto.DueColumn];
			}
			set
			{
				base[tableNetwork_Auto.DueColumn] = value;
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public DateTime DateTime
		{
			get
			{
				return (DateTime)base[tableNetwork_Auto.DateTimeColumn];
			}
			set
			{
				base[tableNetwork_Auto.DateTimeColumn] = value;
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public bool Repeat
		{
			get
			{
				return (bool)base[tableNetwork_Auto.RepeatColumn];
			}
			set
			{
				base[tableNetwork_Auto.RepeatColumn] = value;
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public int Day
		{
			get
			{
				return (int)base[tableNetwork_Auto.DayColumn];
			}
			set
			{
				base[tableNetwork_Auto.DayColumn] = value;
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public int Hour
		{
			get
			{
				return (int)base[tableNetwork_Auto.HourColumn];
			}
			set
			{
				base[tableNetwork_Auto.HourColumn] = value;
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public int Minute
		{
			get
			{
				return (int)base[tableNetwork_Auto.MinuteColumn];
			}
			set
			{
				base[tableNetwork_Auto.MinuteColumn] = value;
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public int Second
		{
			get
			{
				return (int)base[tableNetwork_Auto.SecondColumn];
			}
			set
			{
				base[tableNetwork_Auto.SecondColumn] = value;
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public string Uri
		{
			get
			{
				return (string)base[tableNetwork_Auto.UriColumn];
			}
			set
			{
				base[tableNetwork_Auto.UriColumn] = value;
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public string File
		{
			get
			{
				return (string)base[tableNetwork_Auto.FileColumn];
			}
			set
			{
				base[tableNetwork_Auto.FileColumn] = value;
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public bool Login
		{
			get
			{
				if (IsLoginNull())
				{
					return false;
				}
				return (bool)base[tableNetwork_Auto.LoginColumn];
			}
			set
			{
				base[tableNetwork_Auto.LoginColumn] = value;
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public string User
		{
			get
			{
				return (string)base[tableNetwork_Auto.UserColumn];
			}
			set
			{
				base[tableNetwork_Auto.UserColumn] = value;
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public string Password
		{
			get
			{
				return (string)base[tableNetwork_Auto.PasswordColumn];
			}
			set
			{
				base[tableNetwork_Auto.PasswordColumn] = value;
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		internal Network_AutoRow(DataRowBuilder rb)
			: base(rb)
		{
			tableNetwork_Auto = (Network_AutoDataTable)base.Table;
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public bool IsLoginNull()
		{
			return IsNull(tableNetwork_Auto.LoginColumn);
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public void SetLoginNull()
		{
			base[tableNetwork_Auto.LoginColumn] = Convert.DBNull;
		}
	}

	public class CustomRow : DataRow
	{
		private CustomDataTable tableCustom;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public int ID
		{
			get
			{
				return (int)base[tableCustom.IDColumn];
			}
			set
			{
				base[tableCustom.IDColumn] = value;
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public string Display
		{
			get
			{
				if (IsDisplayNull())
				{
					return string.Empty;
				}
				return (string)base[tableCustom.DisplayColumn];
			}
			set
			{
				base[tableCustom.DisplayColumn] = value;
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public string Menu
		{
			get
			{
				if (IsMenuNull())
				{
					return string.Empty;
				}
				return (string)base[tableCustom.MenuColumn];
			}
			set
			{
				base[tableCustom.MenuColumn] = value;
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public string Keyword
		{
			get
			{
				if (IsKeywordNull())
				{
					return string.Empty;
				}
				return (string)base[tableCustom.KeywordColumn];
			}
			set
			{
				base[tableCustom.KeywordColumn] = value;
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public string _Table
		{
			get
			{
				if (Is_TableNull())
				{
					return string.Empty;
				}
				return (string)base[tableCustom.TableColumn];
			}
			set
			{
				base[tableCustom.TableColumn] = value;
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public bool Visible
		{
			get
			{
				if (IsVisibleNull())
				{
					return false;
				}
				return (bool)base[tableCustom.VisibleColumn];
			}
			set
			{
				base[tableCustom.VisibleColumn] = value;
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public bool Import
		{
			get
			{
				if (IsImportNull())
				{
					return false;
				}
				return (bool)base[tableCustom.ImportColumn];
			}
			set
			{
				base[tableCustom.ImportColumn] = value;
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public bool Export
		{
			get
			{
				if (IsExportNull())
				{
					return false;
				}
				return (bool)base[tableCustom.ExportColumn];
			}
			set
			{
				base[tableCustom.ExportColumn] = value;
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public int Ssp
		{
			get
			{
				if (IsSspNull())
				{
					return 0;
				}
				return (int)base[tableCustom.SspColumn];
			}
			set
			{
				base[tableCustom.SspColumn] = value;
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public int Top
		{
			get
			{
				if (IsTopNull())
				{
					return 0;
				}
				return (int)base[tableCustom.TopColumn];
			}
			set
			{
				base[tableCustom.TopColumn] = value;
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public int Bottom
		{
			get
			{
				if (IsBottomNull())
				{
					return 0;
				}
				return (int)base[tableCustom.BottomColumn];
			}
			set
			{
				base[tableCustom.BottomColumn] = value;
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public int Left
		{
			get
			{
				if (IsLeftNull())
				{
					return 0;
				}
				return (int)base[tableCustom.LeftColumn];
			}
			set
			{
				base[tableCustom.LeftColumn] = value;
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public int Width1
		{
			get
			{
				if (IsWidth1Null())
				{
					return 0;
				}
				return (int)base[tableCustom.Width1Column];
			}
			set
			{
				base[tableCustom.Width1Column] = value;
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public int Width2
		{
			get
			{
				if (IsWidth2Null())
				{
					return 0;
				}
				return (int)base[tableCustom.Width2Column];
			}
			set
			{
				base[tableCustom.Width2Column] = value;
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public int Width3
		{
			get
			{
				if (IsWidth3Null())
				{
					return 0;
				}
				return (int)base[tableCustom.Width3Column];
			}
			set
			{
				base[tableCustom.Width3Column] = value;
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public int Width4
		{
			get
			{
				if (IsWidth4Null())
				{
					return 0;
				}
				return (int)base[tableCustom.Width4Column];
			}
			set
			{
				base[tableCustom.Width4Column] = value;
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public int Width5
		{
			get
			{
				if (IsWidth5Null())
				{
					return 0;
				}
				return (int)base[tableCustom.Width5Column];
			}
			set
			{
				base[tableCustom.Width5Column] = value;
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public int Width6
		{
			get
			{
				if (IsWidth6Null())
				{
					return 0;
				}
				return (int)base[tableCustom.Width6Column];
			}
			set
			{
				base[tableCustom.Width6Column] = value;
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		internal CustomRow(DataRowBuilder rb)
			: base(rb)
		{
			tableCustom = (CustomDataTable)base.Table;
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public bool IsDisplayNull()
		{
			return IsNull(tableCustom.DisplayColumn);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public void SetDisplayNull()
		{
			base[tableCustom.DisplayColumn] = Convert.DBNull;
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public bool IsMenuNull()
		{
			return IsNull(tableCustom.MenuColumn);
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public void SetMenuNull()
		{
			base[tableCustom.MenuColumn] = Convert.DBNull;
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public bool IsKeywordNull()
		{
			return IsNull(tableCustom.KeywordColumn);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public void SetKeywordNull()
		{
			base[tableCustom.KeywordColumn] = Convert.DBNull;
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public bool Is_TableNull()
		{
			return IsNull(tableCustom.TableColumn);
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public void Set_TableNull()
		{
			base[tableCustom.TableColumn] = Convert.DBNull;
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public bool IsVisibleNull()
		{
			return IsNull(tableCustom.VisibleColumn);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public void SetVisibleNull()
		{
			base[tableCustom.VisibleColumn] = Convert.DBNull;
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public bool IsImportNull()
		{
			return IsNull(tableCustom.ImportColumn);
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public void SetImportNull()
		{
			base[tableCustom.ImportColumn] = Convert.DBNull;
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public bool IsExportNull()
		{
			return IsNull(tableCustom.ExportColumn);
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public void SetExportNull()
		{
			base[tableCustom.ExportColumn] = Convert.DBNull;
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public bool IsSspNull()
		{
			return IsNull(tableCustom.SspColumn);
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public void SetSspNull()
		{
			base[tableCustom.SspColumn] = Convert.DBNull;
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public bool IsTopNull()
		{
			return IsNull(tableCustom.TopColumn);
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public void SetTopNull()
		{
			base[tableCustom.TopColumn] = Convert.DBNull;
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public bool IsBottomNull()
		{
			return IsNull(tableCustom.BottomColumn);
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public void SetBottomNull()
		{
			base[tableCustom.BottomColumn] = Convert.DBNull;
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public bool IsLeftNull()
		{
			return IsNull(tableCustom.LeftColumn);
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public void SetLeftNull()
		{
			base[tableCustom.LeftColumn] = Convert.DBNull;
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public bool IsWidth1Null()
		{
			return IsNull(tableCustom.Width1Column);
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public void SetWidth1Null()
		{
			base[tableCustom.Width1Column] = Convert.DBNull;
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public bool IsWidth2Null()
		{
			return IsNull(tableCustom.Width2Column);
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public void SetWidth2Null()
		{
			base[tableCustom.Width2Column] = Convert.DBNull;
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public bool IsWidth3Null()
		{
			return IsNull(tableCustom.Width3Column);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public void SetWidth3Null()
		{
			base[tableCustom.Width3Column] = Convert.DBNull;
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public bool IsWidth4Null()
		{
			return IsNull(tableCustom.Width4Column);
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public void SetWidth4Null()
		{
			base[tableCustom.Width4Column] = Convert.DBNull;
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public bool IsWidth5Null()
		{
			return IsNull(tableCustom.Width5Column);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public void SetWidth5Null()
		{
			base[tableCustom.Width5Column] = Convert.DBNull;
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public bool IsWidth6Null()
		{
			return IsNull(tableCustom.Width6Column);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public void SetWidth6Null()
		{
			base[tableCustom.Width6Column] = Convert.DBNull;
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public CustomItemRow[] GetCustomItemRows()
		{
			if (base.Table.ChildRelations["FK_Custom_CustomItem"] == null)
			{
				return new CustomItemRow[0];
			}
			return (CustomItemRow[])GetChildRows(base.Table.ChildRelations["FK_Custom_CustomItem"]);
		}
	}

	public class CustomItemRow : DataRow
	{
		private CustomItemDataTable tableCustomItem;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public int ID
		{
			get
			{
				return (int)base[tableCustomItem.IDColumn];
			}
			set
			{
				base[tableCustomItem.IDColumn] = value;
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public int Item
		{
			get
			{
				return (int)base[tableCustomItem.ItemColumn];
			}
			set
			{
				base[tableCustomItem.ItemColumn] = value;
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public int Type
		{
			get
			{
				if (IsTypeNull())
				{
					return 0;
				}
				return (int)base[tableCustomItem.TypeColumn];
			}
			set
			{
				base[tableCustomItem.TypeColumn] = value;
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public string Display
		{
			get
			{
				if (IsDisplayNull())
				{
					return string.Empty;
				}
				return (string)base[tableCustomItem.DisplayColumn];
			}
			set
			{
				base[tableCustomItem.DisplayColumn] = value;
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public string GridDisplay
		{
			get
			{
				if (IsGridDisplayNull())
				{
					return string.Empty;
				}
				return (string)base[tableCustomItem.GridDisplayColumn];
			}
			set
			{
				base[tableCustomItem.GridDisplayColumn] = value;
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public string Field
		{
			get
			{
				if (IsFieldNull())
				{
					return string.Empty;
				}
				return (string)base[tableCustomItem.FieldColumn];
			}
			set
			{
				base[tableCustomItem.FieldColumn] = value;
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public bool Visible
		{
			get
			{
				if (IsVisibleNull())
				{
					return false;
				}
				return (bool)base[tableCustomItem.VisibleColumn];
			}
			set
			{
				base[tableCustomItem.VisibleColumn] = value;
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public bool GridVisible
		{
			get
			{
				if (IsGridVisibleNull())
				{
					return false;
				}
				return (bool)base[tableCustomItem.GridVisibleColumn];
			}
			set
			{
				base[tableCustomItem.GridVisibleColumn] = value;
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public int Width
		{
			get
			{
				if (IsWidthNull())
				{
					return 0;
				}
				return (int)base[tableCustomItem.WidthColumn];
			}
			set
			{
				base[tableCustomItem.WidthColumn] = value;
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public CustomRow CustomRow
		{
			get
			{
				return (CustomRow)GetParentRow(base.Table.ParentRelations["FK_Custom_CustomItem"]);
			}
			set
			{
				SetParentRow(value, base.Table.ParentRelations["FK_Custom_CustomItem"]);
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		internal CustomItemRow(DataRowBuilder rb)
			: base(rb)
		{
			tableCustomItem = (CustomItemDataTable)base.Table;
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public bool IsTypeNull()
		{
			return IsNull(tableCustomItem.TypeColumn);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public void SetTypeNull()
		{
			base[tableCustomItem.TypeColumn] = Convert.DBNull;
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public bool IsDisplayNull()
		{
			return IsNull(tableCustomItem.DisplayColumn);
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public void SetDisplayNull()
		{
			base[tableCustomItem.DisplayColumn] = Convert.DBNull;
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public bool IsGridDisplayNull()
		{
			return IsNull(tableCustomItem.GridDisplayColumn);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public void SetGridDisplayNull()
		{
			base[tableCustomItem.GridDisplayColumn] = Convert.DBNull;
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public bool IsFieldNull()
		{
			return IsNull(tableCustomItem.FieldColumn);
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public void SetFieldNull()
		{
			base[tableCustomItem.FieldColumn] = Convert.DBNull;
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public bool IsVisibleNull()
		{
			return IsNull(tableCustomItem.VisibleColumn);
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public void SetVisibleNull()
		{
			base[tableCustomItem.VisibleColumn] = Convert.DBNull;
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public bool IsGridVisibleNull()
		{
			return IsNull(tableCustomItem.GridVisibleColumn);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public void SetGridVisibleNull()
		{
			base[tableCustomItem.GridVisibleColumn] = Convert.DBNull;
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public bool IsWidthNull()
		{
			return IsNull(tableCustomItem.WidthColumn);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public void SetWidthNull()
		{
			base[tableCustomItem.WidthColumn] = Convert.DBNull;
		}
	}

	public class ScPLU_LayoutRow : DataRow
	{
		private ScPLU_LayoutDataTable tableScPLU_Layout;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public string Layout
		{
			get
			{
				return (string)base[tableScPLU_Layout.LayoutColumn];
			}
			set
			{
				base[tableScPLU_Layout.LayoutColumn] = value;
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public string Display
		{
			get
			{
				return (string)base[tableScPLU_Layout.DisplayColumn];
			}
			set
			{
				base[tableScPLU_Layout.DisplayColumn] = value;
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		internal ScPLU_LayoutRow(DataRowBuilder rb)
			: base(rb)
		{
			tableScPLU_Layout = (ScPLU_LayoutDataTable)base.Table;
		}
	}

	public class ScPLU_PageRow : DataRow
	{
		private ScPLU_PageDataTable tableScPLU_Page;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public string Page
		{
			get
			{
				return (string)base[tableScPLU_Page.PageColumn];
			}
			set
			{
				base[tableScPLU_Page.PageColumn] = value;
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public string Display
		{
			get
			{
				return (string)base[tableScPLU_Page.DisplayColumn];
			}
			set
			{
				base[tableScPLU_Page.DisplayColumn] = value;
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		internal ScPLU_PageRow(DataRowBuilder rb)
			: base(rb)
		{
			tableScPLU_Page = (ScPLU_PageDataTable)base.Table;
		}
	}

	public class ScPLU_SectionRow : DataRow
	{
		private ScPLU_SectionDataTable tableScPLU_Section;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public string Page
		{
			get
			{
				return (string)base[tableScPLU_Section.PageColumn];
			}
			set
			{
				base[tableScPLU_Section.PageColumn] = value;
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public int Section
		{
			get
			{
				return (int)base[tableScPLU_Section.SectionColumn];
			}
			set
			{
				base[tableScPLU_Section.SectionColumn] = value;
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public int Data_Page
		{
			get
			{
				try
				{
					return (int)base[tableScPLU_Section.Data_PageColumn];
				}
				catch (InvalidCastException innerException)
				{
					throw new StrongTypingException("表“ScPLU_Section”中列“Data_Page”的值为 DBNull。", innerException);
				}
			}
			set
			{
				base[tableScPLU_Section.Data_PageColumn] = value;
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public int Data_Offset
		{
			get
			{
				try
				{
					return (int)base[tableScPLU_Section.Data_OffsetColumn];
				}
				catch (InvalidCastException innerException)
				{
					throw new StrongTypingException("表“ScPLU_Section”中列“Data_Offset”的值为 DBNull。", innerException);
				}
			}
			set
			{
				base[tableScPLU_Section.Data_OffsetColumn] = value;
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public int Start_X
		{
			get
			{
				try
				{
					return (int)base[tableScPLU_Section.Start_XColumn];
				}
				catch (InvalidCastException innerException)
				{
					throw new StrongTypingException("表“ScPLU_Section”中列“Start_X”的值为 DBNull。", innerException);
				}
			}
			set
			{
				base[tableScPLU_Section.Start_XColumn] = value;
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public int Start_Y
		{
			get
			{
				try
				{
					return (int)base[tableScPLU_Section.Start_YColumn];
				}
				catch (InvalidCastException innerException)
				{
					throw new StrongTypingException("表“ScPLU_Section”中列“Start_Y”的值为 DBNull。", innerException);
				}
			}
			set
			{
				base[tableScPLU_Section.Start_YColumn] = value;
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public int Offset_X
		{
			get
			{
				try
				{
					return (int)base[tableScPLU_Section.Offset_XColumn];
				}
				catch (InvalidCastException innerException)
				{
					throw new StrongTypingException("表“ScPLU_Section”中列“Offset_X”的值为 DBNull。", innerException);
				}
			}
			set
			{
				base[tableScPLU_Section.Offset_XColumn] = value;
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public int Offset_Y
		{
			get
			{
				try
				{
					return (int)base[tableScPLU_Section.Offset_YColumn];
				}
				catch (InvalidCastException innerException)
				{
					throw new StrongTypingException("表“ScPLU_Section”中列“Offset_Y”的值为 DBNull。", innerException);
				}
			}
			set
			{
				base[tableScPLU_Section.Offset_YColumn] = value;
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public int Rect_X
		{
			get
			{
				try
				{
					return (int)base[tableScPLU_Section.Rect_XColumn];
				}
				catch (InvalidCastException innerException)
				{
					throw new StrongTypingException("表“ScPLU_Section”中列“Rect_X”的值为 DBNull。", innerException);
				}
			}
			set
			{
				base[tableScPLU_Section.Rect_XColumn] = value;
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public int Rect_Y
		{
			get
			{
				try
				{
					return (int)base[tableScPLU_Section.Rect_YColumn];
				}
				catch (InvalidCastException innerException)
				{
					throw new StrongTypingException("表“ScPLU_Section”中列“Rect_Y”的值为 DBNull。", innerException);
				}
			}
			set
			{
				base[tableScPLU_Section.Rect_YColumn] = value;
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public int Num_X
		{
			get
			{
				try
				{
					return (int)base[tableScPLU_Section.Num_XColumn];
				}
				catch (InvalidCastException innerException)
				{
					throw new StrongTypingException("表“ScPLU_Section”中列“Num_X”的值为 DBNull。", innerException);
				}
			}
			set
			{
				base[tableScPLU_Section.Num_XColumn] = value;
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public int Num_Y
		{
			get
			{
				try
				{
					return (int)base[tableScPLU_Section.Num_YColumn];
				}
				catch (InvalidCastException innerException)
				{
					throw new StrongTypingException("表“ScPLU_Section”中列“Num_Y”的值为 DBNull。", innerException);
				}
			}
			set
			{
				base[tableScPLU_Section.Num_YColumn] = value;
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		internal ScPLU_SectionRow(DataRowBuilder rb)
			: base(rb)
		{
			tableScPLU_Section = (ScPLU_SectionDataTable)base.Table;
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public bool IsData_PageNull()
		{
			return IsNull(tableScPLU_Section.Data_PageColumn);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public void SetData_PageNull()
		{
			base[tableScPLU_Section.Data_PageColumn] = Convert.DBNull;
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public bool IsData_OffsetNull()
		{
			return IsNull(tableScPLU_Section.Data_OffsetColumn);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public void SetData_OffsetNull()
		{
			base[tableScPLU_Section.Data_OffsetColumn] = Convert.DBNull;
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public bool IsStart_XNull()
		{
			return IsNull(tableScPLU_Section.Start_XColumn);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public void SetStart_XNull()
		{
			base[tableScPLU_Section.Start_XColumn] = Convert.DBNull;
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public bool IsStart_YNull()
		{
			return IsNull(tableScPLU_Section.Start_YColumn);
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public void SetStart_YNull()
		{
			base[tableScPLU_Section.Start_YColumn] = Convert.DBNull;
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public bool IsOffset_XNull()
		{
			return IsNull(tableScPLU_Section.Offset_XColumn);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public void SetOffset_XNull()
		{
			base[tableScPLU_Section.Offset_XColumn] = Convert.DBNull;
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public bool IsOffset_YNull()
		{
			return IsNull(tableScPLU_Section.Offset_YColumn);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public void SetOffset_YNull()
		{
			base[tableScPLU_Section.Offset_YColumn] = Convert.DBNull;
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public bool IsRect_XNull()
		{
			return IsNull(tableScPLU_Section.Rect_XColumn);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public void SetRect_XNull()
		{
			base[tableScPLU_Section.Rect_XColumn] = Convert.DBNull;
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public bool IsRect_YNull()
		{
			return IsNull(tableScPLU_Section.Rect_YColumn);
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public void SetRect_YNull()
		{
			base[tableScPLU_Section.Rect_YColumn] = Convert.DBNull;
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public bool IsNum_XNull()
		{
			return IsNull(tableScPLU_Section.Num_XColumn);
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public void SetNum_XNull()
		{
			base[tableScPLU_Section.Num_XColumn] = Convert.DBNull;
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public bool IsNum_YNull()
		{
			return IsNull(tableScPLU_Section.Num_YColumn);
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public void SetNum_YNull()
		{
			base[tableScPLU_Section.Num_YColumn] = Convert.DBNull;
		}
	}

	public class ScPLU_PageInfoRow : DataRow
	{
		private ScPLU_PageInfoDataTable tableScPLU_PageInfo;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public string Page
		{
			get
			{
				return (string)base[tableScPLU_PageInfo.PageColumn];
			}
			set
			{
				base[tableScPLU_PageInfo.PageColumn] = value;
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public string Bitmap
		{
			get
			{
				try
				{
					return (string)base[tableScPLU_PageInfo.BitmapColumn];
				}
				catch (InvalidCastException innerException)
				{
					throw new StrongTypingException("表“ScPLU_PageInfo”中列“Bitmap”的值为 DBNull。", innerException);
				}
			}
			set
			{
				base[tableScPLU_PageInfo.BitmapColumn] = value;
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		internal ScPLU_PageInfoRow(DataRowBuilder rb)
			: base(rb)
		{
			tableScPLU_PageInfo = (ScPLU_PageInfoDataTable)base.Table;
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public bool IsBitmapNull()
		{
			return IsNull(tableScPLU_PageInfo.BitmapColumn);
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public void SetBitmapNull()
		{
			base[tableScPLU_PageInfo.BitmapColumn] = Convert.DBNull;
		}
	}

	public class TXTForm_TypeRow : DataRow
	{
		private TXTForm_TypeDataTable tableTXTForm_Type;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public string Display
		{
			get
			{
				return (string)base[tableTXTForm_Type.DisplayColumn];
			}
			set
			{
				base[tableTXTForm_Type.DisplayColumn] = value;
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public string Format
		{
			get
			{
				return (string)base[tableTXTForm_Type.FormatColumn];
			}
			set
			{
				base[tableTXTForm_Type.FormatColumn] = value;
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		internal TXTForm_TypeRow(DataRowBuilder rb)
			: base(rb)
		{
			tableTXTForm_Type = (TXTForm_TypeDataTable)base.Table;
		}
	}

	public class SimComboRow : DataRow
	{
		private SimComboDataTable tableSimCombo;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public string Name
		{
			get
			{
				return (string)base[tableSimCombo.NameColumn];
			}
			set
			{
				base[tableSimCombo.NameColumn] = value;
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public string ValueDisplay
		{
			get
			{
				return (string)base[tableSimCombo.ValueDisplayColumn];
			}
			set
			{
				base[tableSimCombo.ValueDisplayColumn] = value;
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		internal SimComboRow(DataRowBuilder rb)
			: base(rb)
		{
			tableSimCombo = (SimComboDataTable)base.Table;
		}
	}

	public class LangRow : DataRow
	{
		private LangDataTable tableLang;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public string Name
		{
			get
			{
				return (string)base[tableLang.NameColumn];
			}
			set
			{
				base[tableLang.NameColumn] = value;
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public string Display
		{
			get
			{
				return (string)base[tableLang.DisplayColumn];
			}
			set
			{
				base[tableLang.DisplayColumn] = value;
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		internal LangRow(DataRowBuilder rb)
			: base(rb)
		{
			tableLang = (LangDataTable)base.Table;
		}
	}

	public class PTCRow : DataRow
	{
		private PTCDataTable tablePTC;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public int ID
		{
			get
			{
				return (int)base[tablePTC.IDColumn];
			}
			set
			{
				base[tablePTC.IDColumn] = value;
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public string CMD1
		{
			get
			{
				return (string)base[tablePTC.CMD1Column];
			}
			set
			{
				base[tablePTC.CMD1Column] = value;
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public string Display1
		{
			get
			{
				return (string)base[tablePTC.Display1Column];
			}
			set
			{
				base[tablePTC.Display1Column] = value;
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public string CMD2
		{
			get
			{
				return (string)base[tablePTC.CMD2Column];
			}
			set
			{
				base[tablePTC.CMD2Column] = value;
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public string Display2
		{
			get
			{
				return (string)base[tablePTC.Display2Column];
			}
			set
			{
				base[tablePTC.Display2Column] = value;
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public string CMD3
		{
			get
			{
				return (string)base[tablePTC.CMD3Column];
			}
			set
			{
				base[tablePTC.CMD3Column] = value;
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public string Display3
		{
			get
			{
				return (string)base[tablePTC.Display3Column];
			}
			set
			{
				base[tablePTC.Display3Column] = value;
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		internal PTCRow(DataRowBuilder rb)
			: base(rb)
		{
			tablePTC = (PTCDataTable)base.Table;
		}
	}

	public class FileTask_ContentRow : DataRow
	{
		private FileTask_ContentDataTable tableFileTask_Content;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public string Command
		{
			get
			{
				return (string)base[tableFileTask_Content.CommandColumn];
			}
			set
			{
				base[tableFileTask_Content.CommandColumn] = value;
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public string Display
		{
			get
			{
				return (string)base[tableFileTask_Content.DisplayColumn];
			}
			set
			{
				base[tableFileTask_Content.DisplayColumn] = value;
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		internal FileTask_ContentRow(DataRowBuilder rb)
			: base(rb)
		{
			tableFileTask_Content = (FileTask_ContentDataTable)base.Table;
		}
	}

	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	public class PLU_PS_DateRowChangeEvent : EventArgs
	{
		private PLU_PS_DateRow eventRow;

		private DataRowAction eventAction;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public PLU_PS_DateRow Row => eventRow;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public DataRowAction Action => eventAction;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public PLU_PS_DateRowChangeEvent(PLU_PS_DateRow row, DataRowAction action)
		{
			eventRow = row;
			eventAction = action;
		}
	}

	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	public class PLU_PS_TimeRowChangeEvent : EventArgs
	{
		private PLU_PS_TimeRow eventRow;

		private DataRowAction eventAction;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public PLU_PS_TimeRow Row => eventRow;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public DataRowAction Action => eventAction;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public PLU_PS_TimeRowChangeEvent(PLU_PS_TimeRow row, DataRowAction action)
		{
			eventRow = row;
			eventAction = action;
		}
	}

	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	public class LabelItem_PrintRowChangeEvent : EventArgs
	{
		private LabelItem_PrintRow eventRow;

		private DataRowAction eventAction;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public LabelItem_PrintRow Row => eventRow;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public DataRowAction Action => eventAction;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public LabelItem_PrintRowChangeEvent(LabelItem_PrintRow row, DataRowAction action)
		{
			eventRow = row;
			eventAction = action;
		}
	}

	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	public class LabelItem_AngleRowChangeEvent : EventArgs
	{
		private LabelItem_AngleRow eventRow;

		private DataRowAction eventAction;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public LabelItem_AngleRow Row => eventRow;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public DataRowAction Action => eventAction;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public LabelItem_AngleRowChangeEvent(LabelItem_AngleRow row, DataRowAction action)
		{
			eventRow = row;
			eventAction = action;
		}
	}

	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	public class LabelItem_Font1RowChangeEvent : EventArgs
	{
		private LabelItem_Font1Row eventRow;

		private DataRowAction eventAction;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public LabelItem_Font1Row Row => eventRow;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public DataRowAction Action => eventAction;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public LabelItem_Font1RowChangeEvent(LabelItem_Font1Row row, DataRowAction action)
		{
			eventRow = row;
			eventAction = action;
		}
	}

	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	public class LabelItem_AlignRowChangeEvent : EventArgs
	{
		private LabelItem_AlignRow eventRow;

		private DataRowAction eventAction;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public LabelItem_AlignRow Row => eventRow;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public DataRowAction Action => eventAction;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public LabelItem_AlignRowChangeEvent(LabelItem_AlignRow row, DataRowAction action)
		{
			eventRow = row;
			eventAction = action;
		}
	}

	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	public class Barcode_SourceRowChangeEvent : EventArgs
	{
		private Barcode_SourceRow eventRow;

		private DataRowAction eventAction;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public Barcode_SourceRow Row => eventRow;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public DataRowAction Action => eventAction;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public Barcode_SourceRowChangeEvent(Barcode_SourceRow row, DataRowAction action)
		{
			eventRow = row;
			eventAction = action;
		}
	}

	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	public class Barcode_OverRowChangeEvent : EventArgs
	{
		private Barcode_OverRow eventRow;

		private DataRowAction eventAction;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public Barcode_OverRow Row => eventRow;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public DataRowAction Action => eventAction;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public Barcode_OverRowChangeEvent(Barcode_OverRow row, DataRowAction action)
		{
			eventRow = row;
			eventAction = action;
		}
	}

	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	public class Barcode_FormatRowChangeEvent : EventArgs
	{
		private Barcode_FormatRow eventRow;

		private DataRowAction eventAction;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public Barcode_FormatRow Row => eventRow;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public DataRowAction Action => eventAction;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public Barcode_FormatRowChangeEvent(Barcode_FormatRow row, DataRowAction action)
		{
			eventRow = row;
			eventAction = action;
		}
	}

	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	public class Barcode_CheckRowChangeEvent : EventArgs
	{
		private Barcode_CheckRow eventRow;

		private DataRowAction eventAction;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public Barcode_CheckRow Row => eventRow;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public DataRowAction Action => eventAction;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public Barcode_CheckRowChangeEvent(Barcode_CheckRow row, DataRowAction action)
		{
			eventRow = row;
			eventAction = action;
		}
	}

	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	public class Label_SortRowChangeEvent : EventArgs
	{
		private Label_SortRow eventRow;

		private DataRowAction eventAction;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public Label_SortRow Row => eventRow;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public DataRowAction Action => eventAction;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public Label_SortRowChangeEvent(Label_SortRow row, DataRowAction action)
		{
			eventRow = row;
			eventAction = action;
		}
	}

	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	public class String_InfoRowChangeEvent : EventArgs
	{
		private String_InfoRow eventRow;

		private DataRowAction eventAction;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public String_InfoRow Row => eventRow;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public DataRowAction Action => eventAction;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public String_InfoRowChangeEvent(String_InfoRow row, DataRowAction action)
		{
			eventRow = row;
			eventAction = action;
		}
	}

	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	public class Spec_InfoRowChangeEvent : EventArgs
	{
		private Spec_InfoRow eventRow;

		private DataRowAction eventAction;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public Spec_InfoRow Row => eventRow;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public DataRowAction Action => eventAction;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public Spec_InfoRowChangeEvent(Spec_InfoRow row, DataRowAction action)
		{
			eventRow = row;
			eventAction = action;
		}
	}

	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	public class PLU_DF_URowChangeEvent : EventArgs
	{
		private PLU_DF_URow eventRow;

		private DataRowAction eventAction;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public PLU_DF_URow Row => eventRow;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public DataRowAction Action => eventAction;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public PLU_DF_URowChangeEvent(PLU_DF_URow row, DataRowAction action)
		{
			eventRow = row;
			eventAction = action;
		}
	}

	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	public class PLU_DF_DRowChangeEvent : EventArgs
	{
		private PLU_DF_DRow eventRow;

		private DataRowAction eventAction;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public PLU_DF_DRow Row => eventRow;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public DataRowAction Action => eventAction;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public PLU_DF_DRowChangeEvent(PLU_DF_DRow row, DataRowAction action)
		{
			eventRow = row;
			eventAction = action;
		}
	}

	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	public class PLU_DA_SortRowChangeEvent : EventArgs
	{
		private PLU_DA_SortRow eventRow;

		private DataRowAction eventAction;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public PLU_DA_SortRow Row => eventRow;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public DataRowAction Action => eventAction;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public PLU_DA_SortRowChangeEvent(PLU_DA_SortRow row, DataRowAction action)
		{
			eventRow = row;
			eventAction = action;
		}
	}

	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	public class LabelItem_Flag1RowChangeEvent : EventArgs
	{
		private LabelItem_Flag1Row eventRow;

		private DataRowAction eventAction;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public LabelItem_Flag1Row Row => eventRow;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public DataRowAction Action => eventAction;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public LabelItem_Flag1RowChangeEvent(LabelItem_Flag1Row row, DataRowAction action)
		{
			eventRow = row;
			eventAction = action;
		}
	}

	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	public class LabelItem_Flag2RowChangeEvent : EventArgs
	{
		private LabelItem_Flag2Row eventRow;

		private DataRowAction eventAction;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public LabelItem_Flag2Row Row => eventRow;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public DataRowAction Action => eventAction;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public LabelItem_Flag2RowChangeEvent(LabelItem_Flag2Row row, DataRowAction action)
		{
			eventRow = row;
			eventAction = action;
		}
	}

	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	public class LabelItem_Flag4RowChangeEvent : EventArgs
	{
		private LabelItem_Flag4Row eventRow;

		private DataRowAction eventAction;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public LabelItem_Flag4Row Row => eventRow;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public DataRowAction Action => eventAction;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public LabelItem_Flag4RowChangeEvent(LabelItem_Flag4Row row, DataRowAction action)
		{
			eventRow = row;
			eventAction = action;
		}
	}

	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	public class LabelItem_Flag3RowChangeEvent : EventArgs
	{
		private LabelItem_Flag3Row eventRow;

		private DataRowAction eventAction;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public LabelItem_Flag3Row Row => eventRow;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public DataRowAction Action => eventAction;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public LabelItem_Flag3RowChangeEvent(LabelItem_Flag3Row row, DataRowAction action)
		{
			eventRow = row;
			eventAction = action;
		}
	}

	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	public class PLU_ColRowChangeEvent : EventArgs
	{
		private PLU_ColRow eventRow;

		private DataRowAction eventAction;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public PLU_ColRow Row => eventRow;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public DataRowAction Action => eventAction;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public PLU_ColRowChangeEvent(PLU_ColRow row, DataRowAction action)
		{
			eventRow = row;
			eventAction = action;
		}
	}

	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	public class ConfigRowChangeEvent : EventArgs
	{
		private ConfigRow eventRow;

		private DataRowAction eventAction;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public ConfigRow Row => eventRow;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public DataRowAction Action => eventAction;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public ConfigRowChangeEvent(ConfigRow row, DataRowAction action)
		{
			eventRow = row;
			eventAction = action;
		}
	}

	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	public class Unit_TypeRowChangeEvent : EventArgs
	{
		private Unit_TypeRow eventRow;

		private DataRowAction eventAction;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public Unit_TypeRow Row => eventRow;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public DataRowAction Action => eventAction;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public Unit_TypeRowChangeEvent(Unit_TypeRow row, DataRowAction action)
		{
			eventRow = row;
			eventAction = action;
		}
	}

	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	public class LabelItem_Font2RowChangeEvent : EventArgs
	{
		private LabelItem_Font2Row eventRow;

		private DataRowAction eventAction;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public LabelItem_Font2Row Row => eventRow;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public DataRowAction Action => eventAction;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public LabelItem_Font2RowChangeEvent(LabelItem_Font2Row row, DataRowAction action)
		{
			eventRow = row;
			eventAction = action;
		}
	}

	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	public class Label_VersionRowChangeEvent : EventArgs
	{
		private Label_VersionRow eventRow;

		private DataRowAction eventAction;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public Label_VersionRow Row => eventRow;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public DataRowAction Action => eventAction;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public Label_VersionRowChangeEvent(Label_VersionRow row, DataRowAction action)
		{
			eventRow = row;
			eventAction = action;
		}
	}

	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	public class PLU_TaxTypeRowChangeEvent : EventArgs
	{
		private PLU_TaxTypeRow eventRow;

		private DataRowAction eventAction;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public PLU_TaxTypeRow Row => eventRow;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public DataRowAction Action => eventAction;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public PLU_TaxTypeRowChangeEvent(PLU_TaxTypeRow row, DataRowAction action)
		{
			eventRow = row;
			eventAction = action;
		}
	}

	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	public class Report_ColRowChangeEvent : EventArgs
	{
		private Report_ColRow eventRow;

		private DataRowAction eventAction;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public Report_ColRow Row => eventRow;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public DataRowAction Action => eventAction;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public Report_ColRowChangeEvent(Report_ColRow row, DataRowAction action)
		{
			eventRow = row;
			eventAction = action;
		}
	}

	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	public class Network_TaskRowChangeEvent : EventArgs
	{
		private Network_TaskRow eventRow;

		private DataRowAction eventAction;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public Network_TaskRow Row => eventRow;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public DataRowAction Action => eventAction;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public Network_TaskRowChangeEvent(Network_TaskRow row, DataRowAction action)
		{
			eventRow = row;
			eventAction = action;
		}
	}

	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	public class Network_DueRowChangeEvent : EventArgs
	{
		private Network_DueRow eventRow;

		private DataRowAction eventAction;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public Network_DueRow Row => eventRow;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public DataRowAction Action => eventAction;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public Network_DueRowChangeEvent(Network_DueRow row, DataRowAction action)
		{
			eventRow = row;
			eventAction = action;
		}
	}

	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	public class Network_AutoRowChangeEvent : EventArgs
	{
		private Network_AutoRow eventRow;

		private DataRowAction eventAction;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public Network_AutoRow Row => eventRow;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public DataRowAction Action => eventAction;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public Network_AutoRowChangeEvent(Network_AutoRow row, DataRowAction action)
		{
			eventRow = row;
			eventAction = action;
		}
	}

	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	public class CustomRowChangeEvent : EventArgs
	{
		private CustomRow eventRow;

		private DataRowAction eventAction;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public CustomRow Row => eventRow;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public DataRowAction Action => eventAction;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public CustomRowChangeEvent(CustomRow row, DataRowAction action)
		{
			eventRow = row;
			eventAction = action;
		}
	}

	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	public class CustomItemRowChangeEvent : EventArgs
	{
		private CustomItemRow eventRow;

		private DataRowAction eventAction;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public CustomItemRow Row => eventRow;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public DataRowAction Action => eventAction;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public CustomItemRowChangeEvent(CustomItemRow row, DataRowAction action)
		{
			eventRow = row;
			eventAction = action;
		}
	}

	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	public class ScPLU_LayoutRowChangeEvent : EventArgs
	{
		private ScPLU_LayoutRow eventRow;

		private DataRowAction eventAction;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public ScPLU_LayoutRow Row => eventRow;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public DataRowAction Action => eventAction;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public ScPLU_LayoutRowChangeEvent(ScPLU_LayoutRow row, DataRowAction action)
		{
			eventRow = row;
			eventAction = action;
		}
	}

	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	public class ScPLU_PageRowChangeEvent : EventArgs
	{
		private ScPLU_PageRow eventRow;

		private DataRowAction eventAction;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public ScPLU_PageRow Row => eventRow;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public DataRowAction Action => eventAction;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public ScPLU_PageRowChangeEvent(ScPLU_PageRow row, DataRowAction action)
		{
			eventRow = row;
			eventAction = action;
		}
	}

	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	public class ScPLU_SectionRowChangeEvent : EventArgs
	{
		private ScPLU_SectionRow eventRow;

		private DataRowAction eventAction;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public ScPLU_SectionRow Row => eventRow;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public DataRowAction Action => eventAction;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public ScPLU_SectionRowChangeEvent(ScPLU_SectionRow row, DataRowAction action)
		{
			eventRow = row;
			eventAction = action;
		}
	}

	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	public class ScPLU_PageInfoRowChangeEvent : EventArgs
	{
		private ScPLU_PageInfoRow eventRow;

		private DataRowAction eventAction;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public ScPLU_PageInfoRow Row => eventRow;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public DataRowAction Action => eventAction;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public ScPLU_PageInfoRowChangeEvent(ScPLU_PageInfoRow row, DataRowAction action)
		{
			eventRow = row;
			eventAction = action;
		}
	}

	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	public class TXTForm_TypeRowChangeEvent : EventArgs
	{
		private TXTForm_TypeRow eventRow;

		private DataRowAction eventAction;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public TXTForm_TypeRow Row => eventRow;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public DataRowAction Action => eventAction;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public TXTForm_TypeRowChangeEvent(TXTForm_TypeRow row, DataRowAction action)
		{
			eventRow = row;
			eventAction = action;
		}
	}

	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	public class SimComboRowChangeEvent : EventArgs
	{
		private SimComboRow eventRow;

		private DataRowAction eventAction;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public SimComboRow Row => eventRow;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public DataRowAction Action => eventAction;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public SimComboRowChangeEvent(SimComboRow row, DataRowAction action)
		{
			eventRow = row;
			eventAction = action;
		}
	}

	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	public class LangRowChangeEvent : EventArgs
	{
		private LangRow eventRow;

		private DataRowAction eventAction;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public LangRow Row => eventRow;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public DataRowAction Action => eventAction;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public LangRowChangeEvent(LangRow row, DataRowAction action)
		{
			eventRow = row;
			eventAction = action;
		}
	}

	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	public class PTCRowChangeEvent : EventArgs
	{
		private PTCRow eventRow;

		private DataRowAction eventAction;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public PTCRow Row => eventRow;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public DataRowAction Action => eventAction;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public PTCRowChangeEvent(PTCRow row, DataRowAction action)
		{
			eventRow = row;
			eventAction = action;
		}
	}

	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	public class FileTask_ContentRowChangeEvent : EventArgs
	{
		private FileTask_ContentRow eventRow;

		private DataRowAction eventAction;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public FileTask_ContentRow Row => eventRow;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public DataRowAction Action => eventAction;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public FileTask_ContentRowChangeEvent(FileTask_ContentRow row, DataRowAction action)
		{
			eventRow = row;
			eventAction = action;
		}
	}

	private PLU_PS_DateDataTable tablePLU_PS_Date;

	private PLU_PS_TimeDataTable tablePLU_PS_Time;

	private LabelItem_PrintDataTable tableLabelItem_Print;

	private LabelItem_AngleDataTable tableLabelItem_Angle;

	private LabelItem_Font1DataTable tableLabelItem_Font1;

	private LabelItem_AlignDataTable tableLabelItem_Align;

	private Barcode_SourceDataTable tableBarcode_Source;

	private Barcode_OverDataTable tableBarcode_Over;

	private Barcode_FormatDataTable tableBarcode_Format;

	private Barcode_CheckDataTable tableBarcode_Check;

	private Label_SortDataTable tableLabel_Sort;

	private String_InfoDataTable tableString_Info;

	private Spec_InfoDataTable tableSpec_Info;

	private PLU_DF_UDataTable tablePLU_DF_U;

	private PLU_DF_DDataTable tablePLU_DF_D;

	private PLU_DA_SortDataTable tablePLU_DA_Sort;

	private LabelItem_Flag1DataTable tableLabelItem_Flag1;

	private LabelItem_Flag2DataTable tableLabelItem_Flag2;

	private LabelItem_Flag4DataTable tableLabelItem_Flag4;

	private LabelItem_Flag3DataTable tableLabelItem_Flag3;

	private PLU_ColDataTable tablePLU_Col;

	private ConfigDataTable tableConfig;

	private Unit_TypeDataTable tableUnit_Type;

	private LabelItem_Font2DataTable tableLabelItem_Font2;

	private Label_VersionDataTable tableLabel_Version;

	private PLU_TaxTypeDataTable tablePLU_TaxType;

	private Report_ColDataTable tableReport_Col;

	private Network_TaskDataTable tableNetwork_Task;

	private Network_DueDataTable tableNetwork_Due;

	private Network_AutoDataTable tableNetwork_Auto;

	private CustomDataTable tableCustom;

	private CustomItemDataTable tableCustomItem;

	private ScPLU_LayoutDataTable tableScPLU_Layout;

	private ScPLU_PageDataTable tableScPLU_Page;

	private ScPLU_SectionDataTable tableScPLU_Section;

	private ScPLU_PageInfoDataTable tableScPLU_PageInfo;

	private TXTForm_TypeDataTable tableTXTForm_Type;

	private SimComboDataTable tableSimCombo;

	private LangDataTable tableLang;

	private PTCDataTable tablePTC;

	private FileTask_ContentDataTable tableFileTask_Content;

	private DataRelation relationLabelItem_Flag1_LabelItem_Flag2;

	private DataRelation relationLabelItem_Flag2_LabelItem_Flag4;

	private DataRelation relationLabelItem_Flag1_LabelItem_Flag3;

	private DataRelation relationFK_Custom_CustomItem;

	private SchemaSerializationMode _schemaSerializationMode = SchemaSerializationMode.IncludeSchema;

	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	[Browsable(false)]
	[DesignerSerializationVisibility(DesignerSerializationVisibility.Content)]
	[DebuggerNonUserCode]
	public PLU_PS_DateDataTable PLU_PS_Date => tablePLU_PS_Date;

	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	[DebuggerNonUserCode]
	[DesignerSerializationVisibility(DesignerSerializationVisibility.Content)]
	[Browsable(false)]
	public PLU_PS_TimeDataTable PLU_PS_Time => tablePLU_PS_Time;

	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	[DesignerSerializationVisibility(DesignerSerializationVisibility.Content)]
	[DebuggerNonUserCode]
	[Browsable(false)]
	public LabelItem_PrintDataTable LabelItem_Print => tableLabelItem_Print;

	[DebuggerNonUserCode]
	[Browsable(false)]
	[DesignerSerializationVisibility(DesignerSerializationVisibility.Content)]
	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	public LabelItem_AngleDataTable LabelItem_Angle => tableLabelItem_Angle;

	[DesignerSerializationVisibility(DesignerSerializationVisibility.Content)]
	[DebuggerNonUserCode]
	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	[Browsable(false)]
	public LabelItem_Font1DataTable LabelItem_Font1 => tableLabelItem_Font1;

	[DebuggerNonUserCode]
	[DesignerSerializationVisibility(DesignerSerializationVisibility.Content)]
	[Browsable(false)]
	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	public LabelItem_AlignDataTable LabelItem_Align => tableLabelItem_Align;

	[DesignerSerializationVisibility(DesignerSerializationVisibility.Content)]
	[DebuggerNonUserCode]
	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	[Browsable(false)]
	public Barcode_SourceDataTable Barcode_Source => tableBarcode_Source;

	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	[DesignerSerializationVisibility(DesignerSerializationVisibility.Content)]
	[DebuggerNonUserCode]
	[Browsable(false)]
	public Barcode_OverDataTable Barcode_Over => tableBarcode_Over;

	[Browsable(false)]
	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	[DesignerSerializationVisibility(DesignerSerializationVisibility.Content)]
	[DebuggerNonUserCode]
	public Barcode_FormatDataTable Barcode_Format => tableBarcode_Format;

	[DebuggerNonUserCode]
	[DesignerSerializationVisibility(DesignerSerializationVisibility.Content)]
	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	[Browsable(false)]
	public Barcode_CheckDataTable Barcode_Check => tableBarcode_Check;

	[DesignerSerializationVisibility(DesignerSerializationVisibility.Content)]
	[DebuggerNonUserCode]
	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	[Browsable(false)]
	public Label_SortDataTable Label_Sort => tableLabel_Sort;

	[DebuggerNonUserCode]
	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	[Browsable(false)]
	[DesignerSerializationVisibility(DesignerSerializationVisibility.Content)]
	public String_InfoDataTable String_Info => tableString_Info;

	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	[Browsable(false)]
	[DebuggerNonUserCode]
	[DesignerSerializationVisibility(DesignerSerializationVisibility.Content)]
	public Spec_InfoDataTable Spec_Info => tableSpec_Info;

	[DesignerSerializationVisibility(DesignerSerializationVisibility.Content)]
	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	[Browsable(false)]
	[DebuggerNonUserCode]
	public PLU_DF_UDataTable PLU_DF_U => tablePLU_DF_U;

	[DebuggerNonUserCode]
	[DesignerSerializationVisibility(DesignerSerializationVisibility.Content)]
	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	[Browsable(false)]
	public PLU_DF_DDataTable PLU_DF_D => tablePLU_DF_D;

	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	[DebuggerNonUserCode]
	[DesignerSerializationVisibility(DesignerSerializationVisibility.Content)]
	[Browsable(false)]
	public PLU_DA_SortDataTable PLU_DA_Sort => tablePLU_DA_Sort;

	[DesignerSerializationVisibility(DesignerSerializationVisibility.Content)]
	[DebuggerNonUserCode]
	[Browsable(false)]
	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	public LabelItem_Flag1DataTable LabelItem_Flag1 => tableLabelItem_Flag1;

	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	[Browsable(false)]
	[DesignerSerializationVisibility(DesignerSerializationVisibility.Content)]
	[DebuggerNonUserCode]
	public LabelItem_Flag2DataTable LabelItem_Flag2 => tableLabelItem_Flag2;

	[Browsable(false)]
	[DesignerSerializationVisibility(DesignerSerializationVisibility.Content)]
	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	[DebuggerNonUserCode]
	public LabelItem_Flag4DataTable LabelItem_Flag4 => tableLabelItem_Flag4;

	[Browsable(false)]
	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	[DebuggerNonUserCode]
	[DesignerSerializationVisibility(DesignerSerializationVisibility.Content)]
	public LabelItem_Flag3DataTable LabelItem_Flag3 => tableLabelItem_Flag3;

	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	[DebuggerNonUserCode]
	[DesignerSerializationVisibility(DesignerSerializationVisibility.Content)]
	[Browsable(false)]
	public PLU_ColDataTable PLU_Col => tablePLU_Col;

	[DebuggerNonUserCode]
	[DesignerSerializationVisibility(DesignerSerializationVisibility.Content)]
	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	[Browsable(false)]
	public ConfigDataTable Config => tableConfig;

	[DesignerSerializationVisibility(DesignerSerializationVisibility.Content)]
	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	[Browsable(false)]
	[DebuggerNonUserCode]
	public Unit_TypeDataTable Unit_Type => tableUnit_Type;

	[DesignerSerializationVisibility(DesignerSerializationVisibility.Content)]
	[DebuggerNonUserCode]
	[Browsable(false)]
	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	public LabelItem_Font2DataTable LabelItem_Font2 => tableLabelItem_Font2;

	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	[DebuggerNonUserCode]
	[Browsable(false)]
	[DesignerSerializationVisibility(DesignerSerializationVisibility.Content)]
	public Label_VersionDataTable Label_Version => tableLabel_Version;

	[DesignerSerializationVisibility(DesignerSerializationVisibility.Content)]
	[DebuggerNonUserCode]
	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	[Browsable(false)]
	public PLU_TaxTypeDataTable PLU_TaxType => tablePLU_TaxType;

	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	[DebuggerNonUserCode]
	[DesignerSerializationVisibility(DesignerSerializationVisibility.Content)]
	[Browsable(false)]
	public Report_ColDataTable Report_Col => tableReport_Col;

	[DesignerSerializationVisibility(DesignerSerializationVisibility.Content)]
	[Browsable(false)]
	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	[DebuggerNonUserCode]
	public Network_TaskDataTable Network_Task => tableNetwork_Task;

	[DebuggerNonUserCode]
	[DesignerSerializationVisibility(DesignerSerializationVisibility.Content)]
	[Browsable(false)]
	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	public Network_DueDataTable Network_Due => tableNetwork_Due;

	[Browsable(false)]
	[DesignerSerializationVisibility(DesignerSerializationVisibility.Content)]
	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	[DebuggerNonUserCode]
	public Network_AutoDataTable Network_Auto => tableNetwork_Auto;

	[DesignerSerializationVisibility(DesignerSerializationVisibility.Content)]
	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	[Browsable(false)]
	[DebuggerNonUserCode]
	public CustomDataTable Custom => tableCustom;

	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	[DebuggerNonUserCode]
	[Browsable(false)]
	[DesignerSerializationVisibility(DesignerSerializationVisibility.Content)]
	public CustomItemDataTable CustomItem => tableCustomItem;

	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	[Browsable(false)]
	[DesignerSerializationVisibility(DesignerSerializationVisibility.Content)]
	[DebuggerNonUserCode]
	public ScPLU_LayoutDataTable ScPLU_Layout => tableScPLU_Layout;

	[Browsable(false)]
	[DesignerSerializationVisibility(DesignerSerializationVisibility.Content)]
	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	[DebuggerNonUserCode]
	public ScPLU_PageDataTable ScPLU_Page => tableScPLU_Page;

	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	[Browsable(false)]
	[DesignerSerializationVisibility(DesignerSerializationVisibility.Content)]
	[DebuggerNonUserCode]
	public ScPLU_SectionDataTable ScPLU_Section => tableScPLU_Section;

	[DebuggerNonUserCode]
	[DesignerSerializationVisibility(DesignerSerializationVisibility.Content)]
	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	[Browsable(false)]
	public ScPLU_PageInfoDataTable ScPLU_PageInfo => tableScPLU_PageInfo;

	[DesignerSerializationVisibility(DesignerSerializationVisibility.Content)]
	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	[Browsable(false)]
	[DebuggerNonUserCode]
	public TXTForm_TypeDataTable TXTForm_Type => tableTXTForm_Type;

	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	[Browsable(false)]
	[DesignerSerializationVisibility(DesignerSerializationVisibility.Content)]
	[DebuggerNonUserCode]
	public SimComboDataTable SimCombo => tableSimCombo;

	[DebuggerNonUserCode]
	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	[Browsable(false)]
	[DesignerSerializationVisibility(DesignerSerializationVisibility.Content)]
	public LangDataTable Lang => tableLang;

	[DesignerSerializationVisibility(DesignerSerializationVisibility.Content)]
	[DebuggerNonUserCode]
	[Browsable(false)]
	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	public PTCDataTable PTC => tablePTC;

	[DebuggerNonUserCode]
	[Browsable(false)]
	[DesignerSerializationVisibility(DesignerSerializationVisibility.Content)]
	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	public FileTask_ContentDataTable FileTask_Content => tableFileTask_Content;

	[Browsable(true)]
	[DesignerSerializationVisibility(DesignerSerializationVisibility.Visible)]
	[DebuggerNonUserCode]
	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	public override SchemaSerializationMode SchemaSerializationMode
	{
		get
		{
			return _schemaSerializationMode;
		}
		set
		{
			_schemaSerializationMode = value;
		}
	}

	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	[DebuggerNonUserCode]
	[DesignerSerializationVisibility(DesignerSerializationVisibility.Hidden)]
	public new DataTableCollection Tables => base.Tables;

	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	[DebuggerNonUserCode]
	[DesignerSerializationVisibility(DesignerSerializationVisibility.Hidden)]
	public new DataRelationCollection Relations => base.Relations;

	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	[DebuggerNonUserCode]
	public UIDataSet()
	{
		BeginInit();
		InitClass();
		CollectionChangeEventHandler value = SchemaChanged;
		base.Tables.CollectionChanged += value;
		base.Relations.CollectionChanged += value;
		EndInit();
	}

	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	[DebuggerNonUserCode]
	protected UIDataSet(SerializationInfo info, StreamingContext context)
		: base(info, context, ConstructSchema: false)
	{
		if (IsBinarySerialized(info, context))
		{
			InitVars(initTable: false);
			CollectionChangeEventHandler value = SchemaChanged;
			Tables.CollectionChanged += value;
			Relations.CollectionChanged += value;
			return;
		}
		string s = (string)info.GetValue("XmlSchema", typeof(string));
		if (DetermineSchemaSerializationMode(info, context) == SchemaSerializationMode.IncludeSchema)
		{
			DataSet dataSet = new DataSet();
			dataSet.ReadXmlSchema(new XmlTextReader(new StringReader(s)));
			if (dataSet.Tables["PLU_PS_Date"] != null)
			{
				base.Tables.Add(new PLU_PS_DateDataTable(dataSet.Tables["PLU_PS_Date"]));
			}
			if (dataSet.Tables["PLU_PS_Time"] != null)
			{
				base.Tables.Add(new PLU_PS_TimeDataTable(dataSet.Tables["PLU_PS_Time"]));
			}
			if (dataSet.Tables["LabelItem_Print"] != null)
			{
				base.Tables.Add(new LabelItem_PrintDataTable(dataSet.Tables["LabelItem_Print"]));
			}
			if (dataSet.Tables["LabelItem_Angle"] != null)
			{
				base.Tables.Add(new LabelItem_AngleDataTable(dataSet.Tables["LabelItem_Angle"]));
			}
			if (dataSet.Tables["LabelItem_Font1"] != null)
			{
				base.Tables.Add(new LabelItem_Font1DataTable(dataSet.Tables["LabelItem_Font1"]));
			}
			if (dataSet.Tables["LabelItem_Align"] != null)
			{
				base.Tables.Add(new LabelItem_AlignDataTable(dataSet.Tables["LabelItem_Align"]));
			}
			if (dataSet.Tables["Barcode_Source"] != null)
			{
				base.Tables.Add(new Barcode_SourceDataTable(dataSet.Tables["Barcode_Source"]));
			}
			if (dataSet.Tables["Barcode_Over"] != null)
			{
				base.Tables.Add(new Barcode_OverDataTable(dataSet.Tables["Barcode_Over"]));
			}
			if (dataSet.Tables["Barcode_Format"] != null)
			{
				base.Tables.Add(new Barcode_FormatDataTable(dataSet.Tables["Barcode_Format"]));
			}
			if (dataSet.Tables["Barcode_Check"] != null)
			{
				base.Tables.Add(new Barcode_CheckDataTable(dataSet.Tables["Barcode_Check"]));
			}
			if (dataSet.Tables["Label_Sort"] != null)
			{
				base.Tables.Add(new Label_SortDataTable(dataSet.Tables["Label_Sort"]));
			}
			if (dataSet.Tables["String_Info"] != null)
			{
				base.Tables.Add(new String_InfoDataTable(dataSet.Tables["String_Info"]));
			}
			if (dataSet.Tables["Spec_Info"] != null)
			{
				base.Tables.Add(new Spec_InfoDataTable(dataSet.Tables["Spec_Info"]));
			}
			if (dataSet.Tables["PLU_DF_U"] != null)
			{
				base.Tables.Add(new PLU_DF_UDataTable(dataSet.Tables["PLU_DF_U"]));
			}
			if (dataSet.Tables["PLU_DF_D"] != null)
			{
				base.Tables.Add(new PLU_DF_DDataTable(dataSet.Tables["PLU_DF_D"]));
			}
			if (dataSet.Tables["PLU_DA_Sort"] != null)
			{
				base.Tables.Add(new PLU_DA_SortDataTable(dataSet.Tables["PLU_DA_Sort"]));
			}
			if (dataSet.Tables["LabelItem_Flag1"] != null)
			{
				base.Tables.Add(new LabelItem_Flag1DataTable(dataSet.Tables["LabelItem_Flag1"]));
			}
			if (dataSet.Tables["LabelItem_Flag2"] != null)
			{
				base.Tables.Add(new LabelItem_Flag2DataTable(dataSet.Tables["LabelItem_Flag2"]));
			}
			if (dataSet.Tables["LabelItem_Flag4"] != null)
			{
				base.Tables.Add(new LabelItem_Flag4DataTable(dataSet.Tables["LabelItem_Flag4"]));
			}
			if (dataSet.Tables["LabelItem_Flag3"] != null)
			{
				base.Tables.Add(new LabelItem_Flag3DataTable(dataSet.Tables["LabelItem_Flag3"]));
			}
			if (dataSet.Tables["PLU_Col"] != null)
			{
				base.Tables.Add(new PLU_ColDataTable(dataSet.Tables["PLU_Col"]));
			}
			if (dataSet.Tables["Config"] != null)
			{
				base.Tables.Add(new ConfigDataTable(dataSet.Tables["Config"]));
			}
			if (dataSet.Tables["Unit_Type"] != null)
			{
				base.Tables.Add(new Unit_TypeDataTable(dataSet.Tables["Unit_Type"]));
			}
			if (dataSet.Tables["LabelItem_Font2"] != null)
			{
				base.Tables.Add(new LabelItem_Font2DataTable(dataSet.Tables["LabelItem_Font2"]));
			}
			if (dataSet.Tables["Label_Version"] != null)
			{
				base.Tables.Add(new Label_VersionDataTable(dataSet.Tables["Label_Version"]));
			}
			if (dataSet.Tables["PLU_TaxType"] != null)
			{
				base.Tables.Add(new PLU_TaxTypeDataTable(dataSet.Tables["PLU_TaxType"]));
			}
			if (dataSet.Tables["Report_Col"] != null)
			{
				base.Tables.Add(new Report_ColDataTable(dataSet.Tables["Report_Col"]));
			}
			if (dataSet.Tables["Network_Task"] != null)
			{
				base.Tables.Add(new Network_TaskDataTable(dataSet.Tables["Network_Task"]));
			}
			if (dataSet.Tables["Network_Due"] != null)
			{
				base.Tables.Add(new Network_DueDataTable(dataSet.Tables["Network_Due"]));
			}
			if (dataSet.Tables["Network_Auto"] != null)
			{
				base.Tables.Add(new Network_AutoDataTable(dataSet.Tables["Network_Auto"]));
			}
			if (dataSet.Tables["Custom"] != null)
			{
				base.Tables.Add(new CustomDataTable(dataSet.Tables["Custom"]));
			}
			if (dataSet.Tables["CustomItem"] != null)
			{
				base.Tables.Add(new CustomItemDataTable(dataSet.Tables["CustomItem"]));
			}
			if (dataSet.Tables["ScPLU_Layout"] != null)
			{
				base.Tables.Add(new ScPLU_LayoutDataTable(dataSet.Tables["ScPLU_Layout"]));
			}
			if (dataSet.Tables["ScPLU_Page"] != null)
			{
				base.Tables.Add(new ScPLU_PageDataTable(dataSet.Tables["ScPLU_Page"]));
			}
			if (dataSet.Tables["ScPLU_Section"] != null)
			{
				base.Tables.Add(new ScPLU_SectionDataTable(dataSet.Tables["ScPLU_Section"]));
			}
			if (dataSet.Tables["ScPLU_PageInfo"] != null)
			{
				base.Tables.Add(new ScPLU_PageInfoDataTable(dataSet.Tables["ScPLU_PageInfo"]));
			}
			if (dataSet.Tables["TXTForm_Type"] != null)
			{
				base.Tables.Add(new TXTForm_TypeDataTable(dataSet.Tables["TXTForm_Type"]));
			}
			if (dataSet.Tables["SimCombo"] != null)
			{
				base.Tables.Add(new SimComboDataTable(dataSet.Tables["SimCombo"]));
			}
			if (dataSet.Tables["Lang"] != null)
			{
				base.Tables.Add(new LangDataTable(dataSet.Tables["Lang"]));
			}
			if (dataSet.Tables["PTC"] != null)
			{
				base.Tables.Add(new PTCDataTable(dataSet.Tables["PTC"]));
			}
			if (dataSet.Tables["FileTask_Content"] != null)
			{
				base.Tables.Add(new FileTask_ContentDataTable(dataSet.Tables["FileTask_Content"]));
			}
			base.DataSetName = dataSet.DataSetName;
			base.Prefix = dataSet.Prefix;
			base.Namespace = dataSet.Namespace;
			base.Locale = dataSet.Locale;
			base.CaseSensitive = dataSet.CaseSensitive;
			base.EnforceConstraints = dataSet.EnforceConstraints;
			Merge(dataSet, preserveChanges: false, MissingSchemaAction.Add);
			InitVars();
		}
		else
		{
			ReadXmlSchema(new XmlTextReader(new StringReader(s)));
		}
		GetSerializationData(info, context);
		CollectionChangeEventHandler value2 = SchemaChanged;
		base.Tables.CollectionChanged += value2;
		Relations.CollectionChanged += value2;
	}

	[DebuggerNonUserCode]
	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	protected override void InitializeDerivedDataSet()
	{
		BeginInit();
		InitClass();
		EndInit();
	}

	[DebuggerNonUserCode]
	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	public override DataSet Clone()
	{
		UIDataSet uIDataSet = (UIDataSet)base.Clone();
		uIDataSet.InitVars();
		uIDataSet.SchemaSerializationMode = SchemaSerializationMode;
		return uIDataSet;
	}

	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	[DebuggerNonUserCode]
	protected override bool ShouldSerializeTables()
	{
		return false;
	}

	[DebuggerNonUserCode]
	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	protected override bool ShouldSerializeRelations()
	{
		return false;
	}

	[DebuggerNonUserCode]
	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	protected override void ReadXmlSerializable(XmlReader reader)
	{
		if (DetermineSchemaSerializationMode(reader) == SchemaSerializationMode.IncludeSchema)
		{
			Reset();
			DataSet dataSet = new DataSet();
			dataSet.ReadXml(reader);
			if (dataSet.Tables["PLU_PS_Date"] != null)
			{
				base.Tables.Add(new PLU_PS_DateDataTable(dataSet.Tables["PLU_PS_Date"]));
			}
			if (dataSet.Tables["PLU_PS_Time"] != null)
			{
				base.Tables.Add(new PLU_PS_TimeDataTable(dataSet.Tables["PLU_PS_Time"]));
			}
			if (dataSet.Tables["LabelItem_Print"] != null)
			{
				base.Tables.Add(new LabelItem_PrintDataTable(dataSet.Tables["LabelItem_Print"]));
			}
			if (dataSet.Tables["LabelItem_Angle"] != null)
			{
				base.Tables.Add(new LabelItem_AngleDataTable(dataSet.Tables["LabelItem_Angle"]));
			}
			if (dataSet.Tables["LabelItem_Font1"] != null)
			{
				base.Tables.Add(new LabelItem_Font1DataTable(dataSet.Tables["LabelItem_Font1"]));
			}
			if (dataSet.Tables["LabelItem_Align"] != null)
			{
				base.Tables.Add(new LabelItem_AlignDataTable(dataSet.Tables["LabelItem_Align"]));
			}
			if (dataSet.Tables["Barcode_Source"] != null)
			{
				base.Tables.Add(new Barcode_SourceDataTable(dataSet.Tables["Barcode_Source"]));
			}
			if (dataSet.Tables["Barcode_Over"] != null)
			{
				base.Tables.Add(new Barcode_OverDataTable(dataSet.Tables["Barcode_Over"]));
			}
			if (dataSet.Tables["Barcode_Format"] != null)
			{
				base.Tables.Add(new Barcode_FormatDataTable(dataSet.Tables["Barcode_Format"]));
			}
			if (dataSet.Tables["Barcode_Check"] != null)
			{
				base.Tables.Add(new Barcode_CheckDataTable(dataSet.Tables["Barcode_Check"]));
			}
			if (dataSet.Tables["Label_Sort"] != null)
			{
				base.Tables.Add(new Label_SortDataTable(dataSet.Tables["Label_Sort"]));
			}
			if (dataSet.Tables["String_Info"] != null)
			{
				base.Tables.Add(new String_InfoDataTable(dataSet.Tables["String_Info"]));
			}
			if (dataSet.Tables["Spec_Info"] != null)
			{
				base.Tables.Add(new Spec_InfoDataTable(dataSet.Tables["Spec_Info"]));
			}
			if (dataSet.Tables["PLU_DF_U"] != null)
			{
				base.Tables.Add(new PLU_DF_UDataTable(dataSet.Tables["PLU_DF_U"]));
			}
			if (dataSet.Tables["PLU_DF_D"] != null)
			{
				base.Tables.Add(new PLU_DF_DDataTable(dataSet.Tables["PLU_DF_D"]));
			}
			if (dataSet.Tables["PLU_DA_Sort"] != null)
			{
				base.Tables.Add(new PLU_DA_SortDataTable(dataSet.Tables["PLU_DA_Sort"]));
			}
			if (dataSet.Tables["LabelItem_Flag1"] != null)
			{
				base.Tables.Add(new LabelItem_Flag1DataTable(dataSet.Tables["LabelItem_Flag1"]));
			}
			if (dataSet.Tables["LabelItem_Flag2"] != null)
			{
				base.Tables.Add(new LabelItem_Flag2DataTable(dataSet.Tables["LabelItem_Flag2"]));
			}
			if (dataSet.Tables["LabelItem_Flag4"] != null)
			{
				base.Tables.Add(new LabelItem_Flag4DataTable(dataSet.Tables["LabelItem_Flag4"]));
			}
			if (dataSet.Tables["LabelItem_Flag3"] != null)
			{
				base.Tables.Add(new LabelItem_Flag3DataTable(dataSet.Tables["LabelItem_Flag3"]));
			}
			if (dataSet.Tables["PLU_Col"] != null)
			{
				base.Tables.Add(new PLU_ColDataTable(dataSet.Tables["PLU_Col"]));
			}
			if (dataSet.Tables["Config"] != null)
			{
				base.Tables.Add(new ConfigDataTable(dataSet.Tables["Config"]));
			}
			if (dataSet.Tables["Unit_Type"] != null)
			{
				base.Tables.Add(new Unit_TypeDataTable(dataSet.Tables["Unit_Type"]));
			}
			if (dataSet.Tables["LabelItem_Font2"] != null)
			{
				base.Tables.Add(new LabelItem_Font2DataTable(dataSet.Tables["LabelItem_Font2"]));
			}
			if (dataSet.Tables["Label_Version"] != null)
			{
				base.Tables.Add(new Label_VersionDataTable(dataSet.Tables["Label_Version"]));
			}
			if (dataSet.Tables["PLU_TaxType"] != null)
			{
				base.Tables.Add(new PLU_TaxTypeDataTable(dataSet.Tables["PLU_TaxType"]));
			}
			if (dataSet.Tables["Report_Col"] != null)
			{
				base.Tables.Add(new Report_ColDataTable(dataSet.Tables["Report_Col"]));
			}
			if (dataSet.Tables["Network_Task"] != null)
			{
				base.Tables.Add(new Network_TaskDataTable(dataSet.Tables["Network_Task"]));
			}
			if (dataSet.Tables["Network_Due"] != null)
			{
				base.Tables.Add(new Network_DueDataTable(dataSet.Tables["Network_Due"]));
			}
			if (dataSet.Tables["Network_Auto"] != null)
			{
				base.Tables.Add(new Network_AutoDataTable(dataSet.Tables["Network_Auto"]));
			}
			if (dataSet.Tables["Custom"] != null)
			{
				base.Tables.Add(new CustomDataTable(dataSet.Tables["Custom"]));
			}
			if (dataSet.Tables["CustomItem"] != null)
			{
				base.Tables.Add(new CustomItemDataTable(dataSet.Tables["CustomItem"]));
			}
			if (dataSet.Tables["ScPLU_Layout"] != null)
			{
				base.Tables.Add(new ScPLU_LayoutDataTable(dataSet.Tables["ScPLU_Layout"]));
			}
			if (dataSet.Tables["ScPLU_Page"] != null)
			{
				base.Tables.Add(new ScPLU_PageDataTable(dataSet.Tables["ScPLU_Page"]));
			}
			if (dataSet.Tables["ScPLU_Section"] != null)
			{
				base.Tables.Add(new ScPLU_SectionDataTable(dataSet.Tables["ScPLU_Section"]));
			}
			if (dataSet.Tables["ScPLU_PageInfo"] != null)
			{
				base.Tables.Add(new ScPLU_PageInfoDataTable(dataSet.Tables["ScPLU_PageInfo"]));
			}
			if (dataSet.Tables["TXTForm_Type"] != null)
			{
				base.Tables.Add(new TXTForm_TypeDataTable(dataSet.Tables["TXTForm_Type"]));
			}
			if (dataSet.Tables["SimCombo"] != null)
			{
				base.Tables.Add(new SimComboDataTable(dataSet.Tables["SimCombo"]));
			}
			if (dataSet.Tables["Lang"] != null)
			{
				base.Tables.Add(new LangDataTable(dataSet.Tables["Lang"]));
			}
			if (dataSet.Tables["PTC"] != null)
			{
				base.Tables.Add(new PTCDataTable(dataSet.Tables["PTC"]));
			}
			if (dataSet.Tables["FileTask_Content"] != null)
			{
				base.Tables.Add(new FileTask_ContentDataTable(dataSet.Tables["FileTask_Content"]));
			}
			base.DataSetName = dataSet.DataSetName;
			base.Prefix = dataSet.Prefix;
			base.Namespace = dataSet.Namespace;
			base.Locale = dataSet.Locale;
			base.CaseSensitive = dataSet.CaseSensitive;
			base.EnforceConstraints = dataSet.EnforceConstraints;
			Merge(dataSet, preserveChanges: false, MissingSchemaAction.Add);
			InitVars();
		}
		else
		{
			ReadXml(reader);
			InitVars();
		}
	}

	[DebuggerNonUserCode]
	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	protected override XmlSchema GetSchemaSerializable()
	{
		MemoryStream memoryStream = new MemoryStream();
		WriteXmlSchema(new XmlTextWriter(memoryStream, null));
		memoryStream.Position = 0L;
		return XmlSchema.Read(new XmlTextReader(memoryStream), null);
	}

	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	[DebuggerNonUserCode]
	internal void InitVars()
	{
		InitVars(initTable: true);
	}

	[DebuggerNonUserCode]
	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	internal void InitVars(bool initTable)
	{
		tablePLU_PS_Date = (PLU_PS_DateDataTable)base.Tables["PLU_PS_Date"];
		if (initTable && tablePLU_PS_Date != null)
		{
			tablePLU_PS_Date.InitVars();
		}
		tablePLU_PS_Time = (PLU_PS_TimeDataTable)base.Tables["PLU_PS_Time"];
		if (initTable && tablePLU_PS_Time != null)
		{
			tablePLU_PS_Time.InitVars();
		}
		tableLabelItem_Print = (LabelItem_PrintDataTable)base.Tables["LabelItem_Print"];
		if (initTable && tableLabelItem_Print != null)
		{
			tableLabelItem_Print.InitVars();
		}
		tableLabelItem_Angle = (LabelItem_AngleDataTable)base.Tables["LabelItem_Angle"];
		if (initTable && tableLabelItem_Angle != null)
		{
			tableLabelItem_Angle.InitVars();
		}
		tableLabelItem_Font1 = (LabelItem_Font1DataTable)base.Tables["LabelItem_Font1"];
		if (initTable && tableLabelItem_Font1 != null)
		{
			tableLabelItem_Font1.InitVars();
		}
		tableLabelItem_Align = (LabelItem_AlignDataTable)base.Tables["LabelItem_Align"];
		if (initTable && tableLabelItem_Align != null)
		{
			tableLabelItem_Align.InitVars();
		}
		tableBarcode_Source = (Barcode_SourceDataTable)base.Tables["Barcode_Source"];
		if (initTable && tableBarcode_Source != null)
		{
			tableBarcode_Source.InitVars();
		}
		tableBarcode_Over = (Barcode_OverDataTable)base.Tables["Barcode_Over"];
		if (initTable && tableBarcode_Over != null)
		{
			tableBarcode_Over.InitVars();
		}
		tableBarcode_Format = (Barcode_FormatDataTable)base.Tables["Barcode_Format"];
		if (initTable && tableBarcode_Format != null)
		{
			tableBarcode_Format.InitVars();
		}
		tableBarcode_Check = (Barcode_CheckDataTable)base.Tables["Barcode_Check"];
		if (initTable && tableBarcode_Check != null)
		{
			tableBarcode_Check.InitVars();
		}
		tableLabel_Sort = (Label_SortDataTable)base.Tables["Label_Sort"];
		if (initTable && tableLabel_Sort != null)
		{
			tableLabel_Sort.InitVars();
		}
		tableString_Info = (String_InfoDataTable)base.Tables["String_Info"];
		if (initTable && tableString_Info != null)
		{
			tableString_Info.InitVars();
		}
		tableSpec_Info = (Spec_InfoDataTable)base.Tables["Spec_Info"];
		if (initTable && tableSpec_Info != null)
		{
			tableSpec_Info.InitVars();
		}
		tablePLU_DF_U = (PLU_DF_UDataTable)base.Tables["PLU_DF_U"];
		if (initTable && tablePLU_DF_U != null)
		{
			tablePLU_DF_U.InitVars();
		}
		tablePLU_DF_D = (PLU_DF_DDataTable)base.Tables["PLU_DF_D"];
		if (initTable && tablePLU_DF_D != null)
		{
			tablePLU_DF_D.InitVars();
		}
		tablePLU_DA_Sort = (PLU_DA_SortDataTable)base.Tables["PLU_DA_Sort"];
		if (initTable && tablePLU_DA_Sort != null)
		{
			tablePLU_DA_Sort.InitVars();
		}
		tableLabelItem_Flag1 = (LabelItem_Flag1DataTable)base.Tables["LabelItem_Flag1"];
		if (initTable && tableLabelItem_Flag1 != null)
		{
			tableLabelItem_Flag1.InitVars();
		}
		tableLabelItem_Flag2 = (LabelItem_Flag2DataTable)base.Tables["LabelItem_Flag2"];
		if (initTable && tableLabelItem_Flag2 != null)
		{
			tableLabelItem_Flag2.InitVars();
		}
		tableLabelItem_Flag4 = (LabelItem_Flag4DataTable)base.Tables["LabelItem_Flag4"];
		if (initTable && tableLabelItem_Flag4 != null)
		{
			tableLabelItem_Flag4.InitVars();
		}
		tableLabelItem_Flag3 = (LabelItem_Flag3DataTable)base.Tables["LabelItem_Flag3"];
		if (initTable && tableLabelItem_Flag3 != null)
		{
			tableLabelItem_Flag3.InitVars();
		}
		tablePLU_Col = (PLU_ColDataTable)base.Tables["PLU_Col"];
		if (initTable && tablePLU_Col != null)
		{
			tablePLU_Col.InitVars();
		}
		tableConfig = (ConfigDataTable)base.Tables["Config"];
		if (initTable && tableConfig != null)
		{
			tableConfig.InitVars();
		}
		tableUnit_Type = (Unit_TypeDataTable)base.Tables["Unit_Type"];
		if (initTable && tableUnit_Type != null)
		{
			tableUnit_Type.InitVars();
		}
		tableLabelItem_Font2 = (LabelItem_Font2DataTable)base.Tables["LabelItem_Font2"];
		if (initTable && tableLabelItem_Font2 != null)
		{
			tableLabelItem_Font2.InitVars();
		}
		tableLabel_Version = (Label_VersionDataTable)base.Tables["Label_Version"];
		if (initTable && tableLabel_Version != null)
		{
			tableLabel_Version.InitVars();
		}
		tablePLU_TaxType = (PLU_TaxTypeDataTable)base.Tables["PLU_TaxType"];
		if (initTable && tablePLU_TaxType != null)
		{
			tablePLU_TaxType.InitVars();
		}
		tableReport_Col = (Report_ColDataTable)base.Tables["Report_Col"];
		if (initTable && tableReport_Col != null)
		{
			tableReport_Col.InitVars();
		}
		tableNetwork_Task = (Network_TaskDataTable)base.Tables["Network_Task"];
		if (initTable && tableNetwork_Task != null)
		{
			tableNetwork_Task.InitVars();
		}
		tableNetwork_Due = (Network_DueDataTable)base.Tables["Network_Due"];
		if (initTable && tableNetwork_Due != null)
		{
			tableNetwork_Due.InitVars();
		}
		tableNetwork_Auto = (Network_AutoDataTable)base.Tables["Network_Auto"];
		if (initTable && tableNetwork_Auto != null)
		{
			tableNetwork_Auto.InitVars();
		}
		tableCustom = (CustomDataTable)base.Tables["Custom"];
		if (initTable && tableCustom != null)
		{
			tableCustom.InitVars();
		}
		tableCustomItem = (CustomItemDataTable)base.Tables["CustomItem"];
		if (initTable && tableCustomItem != null)
		{
			tableCustomItem.InitVars();
		}
		tableScPLU_Layout = (ScPLU_LayoutDataTable)base.Tables["ScPLU_Layout"];
		if (initTable && tableScPLU_Layout != null)
		{
			tableScPLU_Layout.InitVars();
		}
		tableScPLU_Page = (ScPLU_PageDataTable)base.Tables["ScPLU_Page"];
		if (initTable && tableScPLU_Page != null)
		{
			tableScPLU_Page.InitVars();
		}
		tableScPLU_Section = (ScPLU_SectionDataTable)base.Tables["ScPLU_Section"];
		if (initTable && tableScPLU_Section != null)
		{
			tableScPLU_Section.InitVars();
		}
		tableScPLU_PageInfo = (ScPLU_PageInfoDataTable)base.Tables["ScPLU_PageInfo"];
		if (initTable && tableScPLU_PageInfo != null)
		{
			tableScPLU_PageInfo.InitVars();
		}
		tableTXTForm_Type = (TXTForm_TypeDataTable)base.Tables["TXTForm_Type"];
		if (initTable && tableTXTForm_Type != null)
		{
			tableTXTForm_Type.InitVars();
		}
		tableSimCombo = (SimComboDataTable)base.Tables["SimCombo"];
		if (initTable && tableSimCombo != null)
		{
			tableSimCombo.InitVars();
		}
		tableLang = (LangDataTable)base.Tables["Lang"];
		if (initTable && tableLang != null)
		{
			tableLang.InitVars();
		}
		tablePTC = (PTCDataTable)base.Tables["PTC"];
		if (initTable && tablePTC != null)
		{
			tablePTC.InitVars();
		}
		tableFileTask_Content = (FileTask_ContentDataTable)base.Tables["FileTask_Content"];
		if (initTable && tableFileTask_Content != null)
		{
			tableFileTask_Content.InitVars();
		}
		relationLabelItem_Flag1_LabelItem_Flag2 = Relations["LabelItem_Flag1_LabelItem_Flag2"];
		relationLabelItem_Flag2_LabelItem_Flag4 = Relations["LabelItem_Flag2_LabelItem_Flag4"];
		relationLabelItem_Flag1_LabelItem_Flag3 = Relations["LabelItem_Flag1_LabelItem_Flag3"];
		relationFK_Custom_CustomItem = Relations["FK_Custom_CustomItem"];
	}

	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	[DebuggerNonUserCode]
	private void InitClass()
	{
		base.DataSetName = "UIDataSet";
		base.Prefix = "";
		base.Locale = new CultureInfo("zh-CN");
		base.EnforceConstraints = true;
		SchemaSerializationMode = SchemaSerializationMode.IncludeSchema;
		tablePLU_PS_Date = new PLU_PS_DateDataTable();
		base.Tables.Add(tablePLU_PS_Date);
		tablePLU_PS_Time = new PLU_PS_TimeDataTable();
		base.Tables.Add(tablePLU_PS_Time);
		tableLabelItem_Print = new LabelItem_PrintDataTable();
		base.Tables.Add(tableLabelItem_Print);
		tableLabelItem_Angle = new LabelItem_AngleDataTable();
		base.Tables.Add(tableLabelItem_Angle);
		tableLabelItem_Font1 = new LabelItem_Font1DataTable();
		base.Tables.Add(tableLabelItem_Font1);
		tableLabelItem_Align = new LabelItem_AlignDataTable();
		base.Tables.Add(tableLabelItem_Align);
		tableBarcode_Source = new Barcode_SourceDataTable();
		base.Tables.Add(tableBarcode_Source);
		tableBarcode_Over = new Barcode_OverDataTable();
		base.Tables.Add(tableBarcode_Over);
		tableBarcode_Format = new Barcode_FormatDataTable();
		base.Tables.Add(tableBarcode_Format);
		tableBarcode_Check = new Barcode_CheckDataTable();
		base.Tables.Add(tableBarcode_Check);
		tableLabel_Sort = new Label_SortDataTable();
		base.Tables.Add(tableLabel_Sort);
		tableString_Info = new String_InfoDataTable();
		base.Tables.Add(tableString_Info);
		tableSpec_Info = new Spec_InfoDataTable();
		base.Tables.Add(tableSpec_Info);
		tablePLU_DF_U = new PLU_DF_UDataTable();
		base.Tables.Add(tablePLU_DF_U);
		tablePLU_DF_D = new PLU_DF_DDataTable();
		base.Tables.Add(tablePLU_DF_D);
		tablePLU_DA_Sort = new PLU_DA_SortDataTable();
		base.Tables.Add(tablePLU_DA_Sort);
		tableLabelItem_Flag1 = new LabelItem_Flag1DataTable();
		base.Tables.Add(tableLabelItem_Flag1);
		tableLabelItem_Flag2 = new LabelItem_Flag2DataTable();
		base.Tables.Add(tableLabelItem_Flag2);
		tableLabelItem_Flag4 = new LabelItem_Flag4DataTable();
		base.Tables.Add(tableLabelItem_Flag4);
		tableLabelItem_Flag3 = new LabelItem_Flag3DataTable();
		base.Tables.Add(tableLabelItem_Flag3);
		tablePLU_Col = new PLU_ColDataTable();
		base.Tables.Add(tablePLU_Col);
		tableConfig = new ConfigDataTable();
		base.Tables.Add(tableConfig);
		tableUnit_Type = new Unit_TypeDataTable();
		base.Tables.Add(tableUnit_Type);
		tableLabelItem_Font2 = new LabelItem_Font2DataTable();
		base.Tables.Add(tableLabelItem_Font2);
		tableLabel_Version = new Label_VersionDataTable();
		base.Tables.Add(tableLabel_Version);
		tablePLU_TaxType = new PLU_TaxTypeDataTable();
		base.Tables.Add(tablePLU_TaxType);
		tableReport_Col = new Report_ColDataTable();
		base.Tables.Add(tableReport_Col);
		tableNetwork_Task = new Network_TaskDataTable();
		base.Tables.Add(tableNetwork_Task);
		tableNetwork_Due = new Network_DueDataTable();
		base.Tables.Add(tableNetwork_Due);
		tableNetwork_Auto = new Network_AutoDataTable();
		base.Tables.Add(tableNetwork_Auto);
		tableCustom = new CustomDataTable();
		base.Tables.Add(tableCustom);
		tableCustomItem = new CustomItemDataTable();
		base.Tables.Add(tableCustomItem);
		tableScPLU_Layout = new ScPLU_LayoutDataTable();
		base.Tables.Add(tableScPLU_Layout);
		tableScPLU_Page = new ScPLU_PageDataTable();
		base.Tables.Add(tableScPLU_Page);
		tableScPLU_Section = new ScPLU_SectionDataTable();
		base.Tables.Add(tableScPLU_Section);
		tableScPLU_PageInfo = new ScPLU_PageInfoDataTable();
		base.Tables.Add(tableScPLU_PageInfo);
		tableTXTForm_Type = new TXTForm_TypeDataTable();
		base.Tables.Add(tableTXTForm_Type);
		tableSimCombo = new SimComboDataTable();
		base.Tables.Add(tableSimCombo);
		tableLang = new LangDataTable();
		base.Tables.Add(tableLang);
		tablePTC = new PTCDataTable();
		base.Tables.Add(tablePTC);
		tableFileTask_Content = new FileTask_ContentDataTable();
		base.Tables.Add(tableFileTask_Content);
		ForeignKeyConstraint foreignKeyConstraint = new ForeignKeyConstraint("LabelItem_Flag1_LabelItem_Flag2", new DataColumn[1] { tableLabelItem_Flag1.Flag1Column }, new DataColumn[1] { tableLabelItem_Flag2.Flag1Column });
		tableLabelItem_Flag2.Constraints.Add(foreignKeyConstraint);
		foreignKeyConstraint.AcceptRejectRule = AcceptRejectRule.None;
		foreignKeyConstraint.DeleteRule = Rule.Cascade;
		foreignKeyConstraint.UpdateRule = Rule.Cascade;
		foreignKeyConstraint = new ForeignKeyConstraint("LabelItem_Flag2_LabelItem_Flag4", new DataColumn[2] { tableLabelItem_Flag2.Flag1Column, tableLabelItem_Flag2.Flag2Column }, new DataColumn[2] { tableLabelItem_Flag4.Flag1Column, tableLabelItem_Flag4.Flag2Column });
		tableLabelItem_Flag4.Constraints.Add(foreignKeyConstraint);
		foreignKeyConstraint.AcceptRejectRule = AcceptRejectRule.None;
		foreignKeyConstraint.DeleteRule = Rule.Cascade;
		foreignKeyConstraint.UpdateRule = Rule.Cascade;
		foreignKeyConstraint = new ForeignKeyConstraint("LabelItem_Flag1_LabelItem_Flag3", new DataColumn[1] { tableLabelItem_Flag1.Flag1Column }, new DataColumn[1] { tableLabelItem_Flag3.Flag1Column });
		tableLabelItem_Flag3.Constraints.Add(foreignKeyConstraint);
		foreignKeyConstraint.AcceptRejectRule = AcceptRejectRule.None;
		foreignKeyConstraint.DeleteRule = Rule.Cascade;
		foreignKeyConstraint.UpdateRule = Rule.Cascade;
		foreignKeyConstraint = new ForeignKeyConstraint("FK_Custom_CustomItem", new DataColumn[1] { tableCustom.IDColumn }, new DataColumn[1] { tableCustomItem.IDColumn });
		tableCustomItem.Constraints.Add(foreignKeyConstraint);
		foreignKeyConstraint.AcceptRejectRule = AcceptRejectRule.None;
		foreignKeyConstraint.DeleteRule = Rule.Cascade;
		foreignKeyConstraint.UpdateRule = Rule.Cascade;
		relationLabelItem_Flag1_LabelItem_Flag2 = new DataRelation("LabelItem_Flag1_LabelItem_Flag2", new DataColumn[1] { tableLabelItem_Flag1.Flag1Column }, new DataColumn[1] { tableLabelItem_Flag2.Flag1Column }, createConstraints: false);
		relationLabelItem_Flag1_LabelItem_Flag2.Nested = true;
		Relations.Add(relationLabelItem_Flag1_LabelItem_Flag2);
		relationLabelItem_Flag2_LabelItem_Flag4 = new DataRelation("LabelItem_Flag2_LabelItem_Flag4", new DataColumn[2] { tableLabelItem_Flag2.Flag1Column, tableLabelItem_Flag2.Flag2Column }, new DataColumn[2] { tableLabelItem_Flag4.Flag1Column, tableLabelItem_Flag4.Flag2Column }, createConstraints: false);
		relationLabelItem_Flag2_LabelItem_Flag4.Nested = true;
		Relations.Add(relationLabelItem_Flag2_LabelItem_Flag4);
		relationLabelItem_Flag1_LabelItem_Flag3 = new DataRelation("LabelItem_Flag1_LabelItem_Flag3", new DataColumn[1] { tableLabelItem_Flag1.Flag1Column }, new DataColumn[1] { tableLabelItem_Flag3.Flag1Column }, createConstraints: false);
		relationLabelItem_Flag1_LabelItem_Flag3.Nested = true;
		Relations.Add(relationLabelItem_Flag1_LabelItem_Flag3);
		relationFK_Custom_CustomItem = new DataRelation("FK_Custom_CustomItem", new DataColumn[1] { tableCustom.IDColumn }, new DataColumn[1] { tableCustomItem.IDColumn }, createConstraints: false);
		relationFK_Custom_CustomItem.Nested = true;
		Relations.Add(relationFK_Custom_CustomItem);
	}

	[DebuggerNonUserCode]
	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	private bool ShouldSerializePLU_PS_Date()
	{
		return false;
	}

	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	[DebuggerNonUserCode]
	private bool ShouldSerializePLU_PS_Time()
	{
		return false;
	}

	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	[DebuggerNonUserCode]
	private bool ShouldSerializeLabelItem_Print()
	{
		return false;
	}

	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	[DebuggerNonUserCode]
	private bool ShouldSerializeLabelItem_Angle()
	{
		return false;
	}

	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	[DebuggerNonUserCode]
	private bool ShouldSerializeLabelItem_Font1()
	{
		return false;
	}

	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	[DebuggerNonUserCode]
	private bool ShouldSerializeLabelItem_Align()
	{
		return false;
	}

	[DebuggerNonUserCode]
	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	private bool ShouldSerializeBarcode_Source()
	{
		return false;
	}

	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	[DebuggerNonUserCode]
	private bool ShouldSerializeBarcode_Over()
	{
		return false;
	}

	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	[DebuggerNonUserCode]
	private bool ShouldSerializeBarcode_Format()
	{
		return false;
	}

	[DebuggerNonUserCode]
	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	private bool ShouldSerializeBarcode_Check()
	{
		return false;
	}

	[DebuggerNonUserCode]
	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	private bool ShouldSerializeLabel_Sort()
	{
		return false;
	}

	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	[DebuggerNonUserCode]
	private bool ShouldSerializeString_Info()
	{
		return false;
	}

	[DebuggerNonUserCode]
	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	private bool ShouldSerializeSpec_Info()
	{
		return false;
	}

	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	[DebuggerNonUserCode]
	private bool ShouldSerializePLU_DF_U()
	{
		return false;
	}

	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	[DebuggerNonUserCode]
	private bool ShouldSerializePLU_DF_D()
	{
		return false;
	}

	[DebuggerNonUserCode]
	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	private bool ShouldSerializePLU_DA_Sort()
	{
		return false;
	}

	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	[DebuggerNonUserCode]
	private bool ShouldSerializeLabelItem_Flag1()
	{
		return false;
	}

	[DebuggerNonUserCode]
	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	private bool ShouldSerializeLabelItem_Flag2()
	{
		return false;
	}

	[DebuggerNonUserCode]
	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	private bool ShouldSerializeLabelItem_Flag4()
	{
		return false;
	}

	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	[DebuggerNonUserCode]
	private bool ShouldSerializeLabelItem_Flag3()
	{
		return false;
	}

	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	[DebuggerNonUserCode]
	private bool ShouldSerializePLU_Col()
	{
		return false;
	}

	[DebuggerNonUserCode]
	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	private bool ShouldSerializeConfig()
	{
		return false;
	}

	[DebuggerNonUserCode]
	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	private bool ShouldSerializeUnit_Type()
	{
		return false;
	}

	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	[DebuggerNonUserCode]
	private bool ShouldSerializeLabelItem_Font2()
	{
		return false;
	}

	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	[DebuggerNonUserCode]
	private bool ShouldSerializeLabel_Version()
	{
		return false;
	}

	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	[DebuggerNonUserCode]
	private bool ShouldSerializePLU_TaxType()
	{
		return false;
	}

	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	[DebuggerNonUserCode]
	private bool ShouldSerializeReport_Col()
	{
		return false;
	}

	[DebuggerNonUserCode]
	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	private bool ShouldSerializeNetwork_Task()
	{
		return false;
	}

	[DebuggerNonUserCode]
	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	private bool ShouldSerializeNetwork_Due()
	{
		return false;
	}

	[DebuggerNonUserCode]
	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	private bool ShouldSerializeNetwork_Auto()
	{
		return false;
	}

	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	[DebuggerNonUserCode]
	private bool ShouldSerializeCustom()
	{
		return false;
	}

	[DebuggerNonUserCode]
	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	private bool ShouldSerializeCustomItem()
	{
		return false;
	}

	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	[DebuggerNonUserCode]
	private bool ShouldSerializeScPLU_Layout()
	{
		return false;
	}

	[DebuggerNonUserCode]
	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	private bool ShouldSerializeScPLU_Page()
	{
		return false;
	}

	[DebuggerNonUserCode]
	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	private bool ShouldSerializeScPLU_Section()
	{
		return false;
	}

	[DebuggerNonUserCode]
	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	private bool ShouldSerializeScPLU_PageInfo()
	{
		return false;
	}

	[DebuggerNonUserCode]
	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	private bool ShouldSerializeTXTForm_Type()
	{
		return false;
	}

	[DebuggerNonUserCode]
	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	private bool ShouldSerializeSimCombo()
	{
		return false;
	}

	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	[DebuggerNonUserCode]
	private bool ShouldSerializeLang()
	{
		return false;
	}

	[DebuggerNonUserCode]
	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	private bool ShouldSerializePTC()
	{
		return false;
	}

	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	[DebuggerNonUserCode]
	private bool ShouldSerializeFileTask_Content()
	{
		return false;
	}

	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	[DebuggerNonUserCode]
	private void SchemaChanged(object sender, CollectionChangeEventArgs e)
	{
		if (e.Action == CollectionChangeAction.Remove)
		{
			InitVars();
		}
	}

	[DebuggerNonUserCode]
	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	public static XmlSchemaComplexType GetTypedDataSetSchema(XmlSchemaSet xs)
	{
		UIDataSet uIDataSet = new UIDataSet();
		XmlSchemaComplexType xmlSchemaComplexType = new XmlSchemaComplexType();
		XmlSchemaSequence xmlSchemaSequence = new XmlSchemaSequence();
		XmlSchemaAny xmlSchemaAny = new XmlSchemaAny();
		xmlSchemaAny.Namespace = uIDataSet.Namespace;
		xmlSchemaSequence.Items.Add(xmlSchemaAny);
		xmlSchemaComplexType.Particle = xmlSchemaSequence;
		XmlSchema schemaSerializable = uIDataSet.GetSchemaSerializable();
		if (xs.Contains(schemaSerializable.TargetNamespace))
		{
			MemoryStream memoryStream = new MemoryStream();
			MemoryStream memoryStream2 = new MemoryStream();
			try
			{
				XmlSchema xmlSchema = null;
				schemaSerializable.Write(memoryStream);
				IEnumerator enumerator = xs.Schemas(schemaSerializable.TargetNamespace).GetEnumerator();
				while (enumerator.MoveNext())
				{
					xmlSchema = (XmlSchema)enumerator.Current;
					memoryStream2.SetLength(0L);
					xmlSchema.Write(memoryStream2);
					if (memoryStream.Length == memoryStream2.Length)
					{
						memoryStream.Position = 0L;
						memoryStream2.Position = 0L;
						while (memoryStream.Position != memoryStream.Length && memoryStream.ReadByte() == memoryStream2.ReadByte())
						{
						}
						if (memoryStream.Position == memoryStream.Length)
						{
							return xmlSchemaComplexType;
						}
					}
				}
			}
			finally
			{
				memoryStream?.Close();
				memoryStream2?.Close();
			}
		}
		xs.Add(schemaSerializable);
		return xmlSchemaComplexType;
	}
}
