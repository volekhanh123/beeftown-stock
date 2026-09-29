using System;
using System.CodeDom.Compiler;
using System.Collections;
using System.ComponentModel;
using System.ComponentModel.Design;
using System.Data;
using System.Diagnostics;
using System.IO;
using System.Runtime.Serialization;
using System.Xml;
using System.Xml.Schema;
using System.Xml.Serialization;

namespace ECS;

[Serializable]
[ToolboxItem(true)]
[HelpKeyword("vs.data.DataSet")]
[DesignerCategory("code")]
[XmlRoot("ReportDataSet")]
[XmlSchemaProvider("GetTypedDataSetSchema")]
public class ReportDataSet : DataSet
{
	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	public delegate void ExprRowChangeEventHandler(object sender, ExprRowChangeEvent e);

	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	public delegate void ExcelRowChangeEventHandler(object sender, ExcelRowChangeEvent e);

	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	public delegate void DeviceRowChangeEventHandler(object sender, DeviceRowChangeEvent e);

	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	public delegate void LogRowChangeEventHandler(object sender, LogRowChangeEvent e);

	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	public delegate void LogItemRowChangeEventHandler(object sender, LogItemRowChangeEvent e);

	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	public delegate void SGroupRowChangeEventHandler(object sender, SGroupRowChangeEvent e);

	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	public delegate void StockRowChangeEventHandler(object sender, StockRowChangeEvent e);

	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	public delegate void StockItemRowChangeEventHandler(object sender, StockItemRowChangeEvent e);

	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	public delegate void rPLURowChangeEventHandler(object sender, rPLURowChangeEvent e);

	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	public delegate void rUnitRowChangeEventHandler(object sender, rUnitRowChangeEvent e);

	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	public delegate void AllLogsRowChangeEventHandler(object sender, AllLogsRowChangeEvent e);

	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	public delegate void AllStocksRowChangeEventHandler(object sender, AllStocksRowChangeEvent e);

	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	public delegate void rLogsTypeRowChangeEventHandler(object sender, rLogsTypeRowChangeEvent e);

	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	public delegate void rStockTypeRowChangeEventHandler(object sender, rStockTypeRowChangeEvent e);

	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	public delegate void ResultLogRowChangeEventHandler(object sender, ResultLogRowChangeEvent e);

	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	public delegate void ResultLogItemRowChangeEventHandler(object sender, ResultLogItemRowChangeEvent e);

	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	public delegate void HistoryRowChangeEventHandler(object sender, HistoryRowChangeEvent e);

	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	public delegate void StockMultiItemRowChangeEventHandler(object sender, StockMultiItemRowChangeEvent e);

	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	public delegate void StockExcelItemRowChangeEventHandler(object sender, StockExcelItemRowChangeEvent e);

	[Serializable]
	[XmlSchemaProvider("GetTypedTableSchema")]
	public class ExprDataTable : DataTable, IEnumerable
	{
		private DataColumn columnID;

		private DataColumn columnNot;

		private DataColumn columnAndOr;

		private DataColumn columnField;

		private DataColumn columnOp;

		private DataColumn columnExpr1;

		private DataColumn columnExpr2;

		private DataColumn columnDisplay;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public DataColumn IDColumn => columnID;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public DataColumn NotColumn => columnNot;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public DataColumn AndOrColumn => columnAndOr;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public DataColumn FieldColumn => columnField;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public DataColumn OpColumn => columnOp;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public DataColumn Expr1Column => columnExpr1;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public DataColumn Expr2Column => columnExpr2;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public DataColumn DisplayColumn => columnDisplay;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[Browsable(false)]
		public int Count => base.Rows.Count;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public ExprRow this[int index] => (ExprRow)base.Rows[index];

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public event ExprRowChangeEventHandler ExprRowChanging;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public event ExprRowChangeEventHandler ExprRowChanged;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public event ExprRowChangeEventHandler ExprRowDeleting;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public event ExprRowChangeEventHandler ExprRowDeleted;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public ExprDataTable()
		{
			base.TableName = "Expr";
			BeginInit();
			InitClass();
			EndInit();
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		internal ExprDataTable(DataTable table)
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
		protected ExprDataTable(SerializationInfo info, StreamingContext context)
			: base(info, context)
		{
			InitVars();
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public void AddExprRow(ExprRow row)
		{
			base.Rows.Add(row);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public ExprRow AddExprRow(bool Not, string AndOr, string Field, string Op, string Expr1, string Expr2, string Display)
		{
			ExprRow exprRow = (ExprRow)NewRow();
			object[] itemArray = new object[8] { null, Not, AndOr, Field, Op, Expr1, Expr2, Display };
			exprRow.ItemArray = itemArray;
			base.Rows.Add(exprRow);
			return exprRow;
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public ExprRow FindByID(int ID)
		{
			return (ExprRow)base.Rows.Find(new object[1] { ID });
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
			ExprDataTable exprDataTable = (ExprDataTable)base.Clone();
			exprDataTable.InitVars();
			return exprDataTable;
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		protected override DataTable CreateInstance()
		{
			return new ExprDataTable();
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		internal void InitVars()
		{
			columnID = base.Columns["ID"];
			columnNot = base.Columns["Not"];
			columnAndOr = base.Columns["AndOr"];
			columnField = base.Columns["Field"];
			columnOp = base.Columns["Op"];
			columnExpr1 = base.Columns["Expr1"];
			columnExpr2 = base.Columns["Expr2"];
			columnDisplay = base.Columns["Display"];
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		private void InitClass()
		{
			columnID = new DataColumn("ID", typeof(int), null, MappingType.Element);
			base.Columns.Add(columnID);
			columnNot = new DataColumn("Not", typeof(bool), null, MappingType.Element);
			base.Columns.Add(columnNot);
			columnAndOr = new DataColumn("AndOr", typeof(string), null, MappingType.Element);
			base.Columns.Add(columnAndOr);
			columnField = new DataColumn("Field", typeof(string), null, MappingType.Element);
			base.Columns.Add(columnField);
			columnOp = new DataColumn("Op", typeof(string), null, MappingType.Element);
			base.Columns.Add(columnOp);
			columnExpr1 = new DataColumn("Expr1", typeof(string), null, MappingType.Element);
			base.Columns.Add(columnExpr1);
			columnExpr2 = new DataColumn("Expr2", typeof(string), null, MappingType.Element);
			base.Columns.Add(columnExpr2);
			columnDisplay = new DataColumn("Display", typeof(string), null, MappingType.Element);
			base.Columns.Add(columnDisplay);
			base.Constraints.Add(new UniqueConstraint("Constraint1", new DataColumn[1] { columnID }, isPrimaryKey: true));
			columnID.AutoIncrement = true;
			columnID.AllowDBNull = false;
			columnID.Unique = true;
			columnNot.DefaultValue = false;
			columnAndOr.DefaultValue = "AND";
			columnAndOr.MaxLength = 255;
			columnField.DefaultValue = "[LogItem].[Type]";
			columnField.MaxLength = 255;
			columnOp.DefaultValue = "";
			columnOp.MaxLength = 255;
			columnExpr1.DefaultValue = "";
			columnExpr1.MaxLength = 255;
			columnExpr2.DefaultValue = "";
			columnExpr2.MaxLength = 255;
			columnDisplay.DefaultValue = "";
			columnDisplay.MaxLength = 255;
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public ExprRow NewExprRow()
		{
			return (ExprRow)NewRow();
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		protected override DataRow NewRowFromBuilder(DataRowBuilder builder)
		{
			return new ExprRow(builder);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		protected override Type GetRowType()
		{
			return typeof(ExprRow);
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		protected override void OnRowChanged(DataRowChangeEventArgs e)
		{
			base.OnRowChanged(e);
			if (this.ExprRowChanged != null)
			{
				this.ExprRowChanged(this, new ExprRowChangeEvent((ExprRow)e.Row, e.Action));
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		protected override void OnRowChanging(DataRowChangeEventArgs e)
		{
			base.OnRowChanging(e);
			if (this.ExprRowChanging != null)
			{
				this.ExprRowChanging(this, new ExprRowChangeEvent((ExprRow)e.Row, e.Action));
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		protected override void OnRowDeleted(DataRowChangeEventArgs e)
		{
			base.OnRowDeleted(e);
			if (this.ExprRowDeleted != null)
			{
				this.ExprRowDeleted(this, new ExprRowChangeEvent((ExprRow)e.Row, e.Action));
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		protected override void OnRowDeleting(DataRowChangeEventArgs e)
		{
			base.OnRowDeleting(e);
			if (this.ExprRowDeleting != null)
			{
				this.ExprRowDeleting(this, new ExprRowChangeEvent((ExprRow)e.Row, e.Action));
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public void RemoveExprRow(ExprRow row)
		{
			base.Rows.Remove(row);
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public static XmlSchemaComplexType GetTypedTableSchema(XmlSchemaSet xs)
		{
			XmlSchemaComplexType xmlSchemaComplexType = new XmlSchemaComplexType();
			XmlSchemaSequence xmlSchemaSequence = new XmlSchemaSequence();
			ReportDataSet reportDataSet = new ReportDataSet();
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
			xmlSchemaAttribute.FixedValue = reportDataSet.Namespace;
			xmlSchemaComplexType.Attributes.Add(xmlSchemaAttribute);
			XmlSchemaAttribute xmlSchemaAttribute2 = new XmlSchemaAttribute();
			xmlSchemaAttribute2.Name = "tableTypeName";
			xmlSchemaAttribute2.FixedValue = "ExprDataTable";
			xmlSchemaComplexType.Attributes.Add(xmlSchemaAttribute2);
			xmlSchemaComplexType.Particle = xmlSchemaSequence;
			XmlSchema schemaSerializable = reportDataSet.GetSchemaSerializable();
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
	public class ExcelDataTable : DataTable, IEnumerable
	{
		private DataColumn columnID;

		private DataColumn columnField;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public DataColumn IDColumn => columnID;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public DataColumn FieldColumn => columnField;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		[Browsable(false)]
		public int Count => base.Rows.Count;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public ExcelRow this[int index] => (ExcelRow)base.Rows[index];

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public event ExcelRowChangeEventHandler ExcelRowChanging;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public event ExcelRowChangeEventHandler ExcelRowChanged;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public event ExcelRowChangeEventHandler ExcelRowDeleting;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public event ExcelRowChangeEventHandler ExcelRowDeleted;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public ExcelDataTable()
		{
			base.TableName = "Excel";
			BeginInit();
			InitClass();
			EndInit();
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		internal ExcelDataTable(DataTable table)
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
		protected ExcelDataTable(SerializationInfo info, StreamingContext context)
			: base(info, context)
		{
			InitVars();
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public void AddExcelRow(ExcelRow row)
		{
			base.Rows.Add(row);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public ExcelRow AddExcelRow(string Field)
		{
			ExcelRow excelRow = (ExcelRow)NewRow();
			object[] itemArray = new object[2] { null, Field };
			excelRow.ItemArray = itemArray;
			base.Rows.Add(excelRow);
			return excelRow;
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public ExcelRow FindByID(int ID)
		{
			return (ExcelRow)base.Rows.Find(new object[1] { ID });
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
			ExcelDataTable excelDataTable = (ExcelDataTable)base.Clone();
			excelDataTable.InitVars();
			return excelDataTable;
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		protected override DataTable CreateInstance()
		{
			return new ExcelDataTable();
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		internal void InitVars()
		{
			columnID = base.Columns["ID"];
			columnField = base.Columns["Field"];
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		private void InitClass()
		{
			columnID = new DataColumn("ID", typeof(int), null, MappingType.Element);
			base.Columns.Add(columnID);
			columnField = new DataColumn("Field", typeof(string), null, MappingType.Element);
			base.Columns.Add(columnField);
			base.Constraints.Add(new UniqueConstraint("Constraint1", new DataColumn[1] { columnID }, isPrimaryKey: true));
			columnID.AutoIncrement = true;
			columnID.AllowDBNull = false;
			columnID.Unique = true;
			columnField.DefaultValue = "";
			columnField.MaxLength = 255;
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public ExcelRow NewExcelRow()
		{
			return (ExcelRow)NewRow();
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		protected override DataRow NewRowFromBuilder(DataRowBuilder builder)
		{
			return new ExcelRow(builder);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		protected override Type GetRowType()
		{
			return typeof(ExcelRow);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		protected override void OnRowChanged(DataRowChangeEventArgs e)
		{
			base.OnRowChanged(e);
			if (this.ExcelRowChanged != null)
			{
				this.ExcelRowChanged(this, new ExcelRowChangeEvent((ExcelRow)e.Row, e.Action));
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		protected override void OnRowChanging(DataRowChangeEventArgs e)
		{
			base.OnRowChanging(e);
			if (this.ExcelRowChanging != null)
			{
				this.ExcelRowChanging(this, new ExcelRowChangeEvent((ExcelRow)e.Row, e.Action));
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		protected override void OnRowDeleted(DataRowChangeEventArgs e)
		{
			base.OnRowDeleted(e);
			if (this.ExcelRowDeleted != null)
			{
				this.ExcelRowDeleted(this, new ExcelRowChangeEvent((ExcelRow)e.Row, e.Action));
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		protected override void OnRowDeleting(DataRowChangeEventArgs e)
		{
			base.OnRowDeleting(e);
			if (this.ExcelRowDeleting != null)
			{
				this.ExcelRowDeleting(this, new ExcelRowChangeEvent((ExcelRow)e.Row, e.Action));
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public void RemoveExcelRow(ExcelRow row)
		{
			base.Rows.Remove(row);
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public static XmlSchemaComplexType GetTypedTableSchema(XmlSchemaSet xs)
		{
			XmlSchemaComplexType xmlSchemaComplexType = new XmlSchemaComplexType();
			XmlSchemaSequence xmlSchemaSequence = new XmlSchemaSequence();
			ReportDataSet reportDataSet = new ReportDataSet();
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
			xmlSchemaAttribute.FixedValue = reportDataSet.Namespace;
			xmlSchemaComplexType.Attributes.Add(xmlSchemaAttribute);
			XmlSchemaAttribute xmlSchemaAttribute2 = new XmlSchemaAttribute();
			xmlSchemaAttribute2.Name = "tableTypeName";
			xmlSchemaAttribute2.FixedValue = "ExcelDataTable";
			xmlSchemaComplexType.Attributes.Add(xmlSchemaAttribute2);
			xmlSchemaComplexType.Particle = xmlSchemaSequence;
			XmlSchema schemaSerializable = reportDataSet.GetSchemaSerializable();
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
	public class DeviceDataTable : DataTable, IEnumerable
	{
		private DataColumn columnMAC;

		private DataColumn columnName;

		private DataColumn columnGID;

		private DataColumn columnFIDed;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public DataColumn MACColumn => columnMAC;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public DataColumn NameColumn => columnName;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public DataColumn GIDColumn => columnGID;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public DataColumn FIDedColumn => columnFIDed;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[Browsable(false)]
		[DebuggerNonUserCode]
		public int Count => base.Rows.Count;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public DeviceRow this[int index] => (DeviceRow)base.Rows[index];

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public event DeviceRowChangeEventHandler DeviceRowChanging;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public event DeviceRowChangeEventHandler DeviceRowChanged;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public event DeviceRowChangeEventHandler DeviceRowDeleting;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public event DeviceRowChangeEventHandler DeviceRowDeleted;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public DeviceDataTable()
		{
			base.TableName = "Device";
			BeginInit();
			InitClass();
			EndInit();
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		internal DeviceDataTable(DataTable table)
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
		protected DeviceDataTable(SerializationInfo info, StreamingContext context)
			: base(info, context)
		{
			InitVars();
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public void AddDeviceRow(DeviceRow row)
		{
			base.Rows.Add(row);
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public DeviceRow AddDeviceRow(string MAC, string Name, SGroupRow parentSGroupRowByFK_SGroup_Device, int FIDed)
		{
			DeviceRow deviceRow = (DeviceRow)NewRow();
			object[] array = new object[4] { MAC, Name, null, FIDed };
			if (parentSGroupRowByFK_SGroup_Device != null)
			{
				array[2] = parentSGroupRowByFK_SGroup_Device[0];
			}
			deviceRow.ItemArray = array;
			base.Rows.Add(deviceRow);
			return deviceRow;
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public DeviceRow FindByMAC(string MAC)
		{
			return (DeviceRow)base.Rows.Find(new object[1] { MAC });
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
			DeviceDataTable deviceDataTable = (DeviceDataTable)base.Clone();
			deviceDataTable.InitVars();
			return deviceDataTable;
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		protected override DataTable CreateInstance()
		{
			return new DeviceDataTable();
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		internal void InitVars()
		{
			columnMAC = base.Columns["MAC"];
			columnName = base.Columns["Name"];
			columnGID = base.Columns["GID"];
			columnFIDed = base.Columns["FIDed"];
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		private void InitClass()
		{
			columnMAC = new DataColumn("MAC", typeof(string), null, MappingType.Element);
			base.Columns.Add(columnMAC);
			columnName = new DataColumn("Name", typeof(string), null, MappingType.Element);
			base.Columns.Add(columnName);
			columnGID = new DataColumn("GID", typeof(int), null, MappingType.Element);
			base.Columns.Add(columnGID);
			columnFIDed = new DataColumn("FIDed", typeof(int), null, MappingType.Element);
			base.Columns.Add(columnFIDed);
			base.Constraints.Add(new UniqueConstraint("Constraint1", new DataColumn[1] { columnMAC }, isPrimaryKey: true));
			columnMAC.AllowDBNull = false;
			columnMAC.Unique = true;
			columnMAC.MaxLength = 255;
			columnName.MaxLength = 255;
			columnFIDed.DefaultValue = 0;
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public DeviceRow NewDeviceRow()
		{
			return (DeviceRow)NewRow();
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		protected override DataRow NewRowFromBuilder(DataRowBuilder builder)
		{
			return new DeviceRow(builder);
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		protected override Type GetRowType()
		{
			return typeof(DeviceRow);
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		protected override void OnRowChanged(DataRowChangeEventArgs e)
		{
			base.OnRowChanged(e);
			if (this.DeviceRowChanged != null)
			{
				this.DeviceRowChanged(this, new DeviceRowChangeEvent((DeviceRow)e.Row, e.Action));
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		protected override void OnRowChanging(DataRowChangeEventArgs e)
		{
			base.OnRowChanging(e);
			if (this.DeviceRowChanging != null)
			{
				this.DeviceRowChanging(this, new DeviceRowChangeEvent((DeviceRow)e.Row, e.Action));
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		protected override void OnRowDeleted(DataRowChangeEventArgs e)
		{
			base.OnRowDeleted(e);
			if (this.DeviceRowDeleted != null)
			{
				this.DeviceRowDeleted(this, new DeviceRowChangeEvent((DeviceRow)e.Row, e.Action));
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		protected override void OnRowDeleting(DataRowChangeEventArgs e)
		{
			base.OnRowDeleting(e);
			if (this.DeviceRowDeleting != null)
			{
				this.DeviceRowDeleting(this, new DeviceRowChangeEvent((DeviceRow)e.Row, e.Action));
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public void RemoveDeviceRow(DeviceRow row)
		{
			base.Rows.Remove(row);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public static XmlSchemaComplexType GetTypedTableSchema(XmlSchemaSet xs)
		{
			XmlSchemaComplexType xmlSchemaComplexType = new XmlSchemaComplexType();
			XmlSchemaSequence xmlSchemaSequence = new XmlSchemaSequence();
			ReportDataSet reportDataSet = new ReportDataSet();
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
			xmlSchemaAttribute.FixedValue = reportDataSet.Namespace;
			xmlSchemaComplexType.Attributes.Add(xmlSchemaAttribute);
			XmlSchemaAttribute xmlSchemaAttribute2 = new XmlSchemaAttribute();
			xmlSchemaAttribute2.Name = "tableTypeName";
			xmlSchemaAttribute2.FixedValue = "DeviceDataTable";
			xmlSchemaComplexType.Attributes.Add(xmlSchemaAttribute2);
			xmlSchemaComplexType.Particle = xmlSchemaSequence;
			XmlSchema schemaSerializable = reportDataSet.GetSchemaSerializable();
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
	public class LogDataTable : DataTable, IEnumerable
	{
		private DataColumn columnMAC;

		private DataColumn columnFID;

		private DataColumn columnDateTime;

		private DataColumn columnSID;

		private DataColumn columnSalesman;

		private DataColumn columnDisRound;

		private DataColumn columnSfee;

		private DataColumn columnPayment_Card;

		private DataColumn columnPayment_Other_1;

		private DataColumn columnPayment_Other_2;

		private DataColumn columnPayment_Other_3;

		private DataColumn columnPayment_Total;

		private DataColumn columnTax;

		private DataColumn columnCost;

		private DataColumn columnSubNo;

		private DataColumn columnAlipay;

		private DataColumn columnWXpay;

		private DataColumn columnEpay2;

		private DataColumn columnEpay3;

		private DataColumn columnEpay4;

		private DataColumn columnEpay5;

		private DataColumn columnEpay6;

		private DataColumn columnEpay7;

		private static DateTime columnDateTime_defaultValue = DateTime.Parse("2000-01-01T00:00:00");

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public DataColumn MACColumn => columnMAC;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public DataColumn FIDColumn => columnFID;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public DataColumn DateTimeColumn => columnDateTime;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public DataColumn SIDColumn => columnSID;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public DataColumn SalesmanColumn => columnSalesman;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public DataColumn DisRoundColumn => columnDisRound;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public DataColumn SfeeColumn => columnSfee;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public DataColumn Payment_CardColumn => columnPayment_Card;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public DataColumn Payment_Other_1Column => columnPayment_Other_1;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public DataColumn Payment_Other_2Column => columnPayment_Other_2;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public DataColumn Payment_Other_3Column => columnPayment_Other_3;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public DataColumn Payment_TotalColumn => columnPayment_Total;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public DataColumn TaxColumn => columnTax;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public DataColumn CostColumn => columnCost;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public DataColumn SubNoColumn => columnSubNo;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public DataColumn AlipayColumn => columnAlipay;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public DataColumn WXpayColumn => columnWXpay;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public DataColumn Epay2Column => columnEpay2;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public DataColumn Epay3Column => columnEpay3;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public DataColumn Epay4Column => columnEpay4;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public DataColumn Epay5Column => columnEpay5;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public DataColumn Epay6Column => columnEpay6;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public DataColumn Epay7Column => columnEpay7;

		[Browsable(false)]
		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public int Count => base.Rows.Count;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public LogRow this[int index] => (LogRow)base.Rows[index];

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public event LogRowChangeEventHandler LogRowChanging;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public event LogRowChangeEventHandler LogRowChanged;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public event LogRowChangeEventHandler LogRowDeleting;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public event LogRowChangeEventHandler LogRowDeleted;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public LogDataTable()
		{
			base.TableName = "Log";
			BeginInit();
			InitClass();
			EndInit();
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		internal LogDataTable(DataTable table)
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
		protected LogDataTable(SerializationInfo info, StreamingContext context)
			: base(info, context)
		{
			InitVars();
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public void AddLogRow(LogRow row)
		{
			base.Rows.Add(row);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public LogRow AddLogRow(DeviceRow parentDeviceRowByFK_Device_Log, int FID, DateTime DateTime, int SID, int Salesman, decimal DisRound, decimal Sfee, decimal Payment_Card, decimal Payment_Other_1, decimal Payment_Other_2, decimal Payment_Other_3, decimal Payment_Total, decimal Tax, decimal Cost, int SubNo, decimal Alipay, decimal WXpay, decimal Epay2, decimal Epay3, decimal Epay4, decimal Epay5, decimal Epay6, decimal Epay7)
		{
			LogRow logRow = (LogRow)NewRow();
			object[] array = new object[23]
			{
				null, FID, DateTime, SID, Salesman, DisRound, Sfee, Payment_Card, Payment_Other_1, Payment_Other_2,
				Payment_Other_3, Payment_Total, Tax, Cost, SubNo, Alipay, WXpay, Epay2, Epay3, Epay4,
				Epay5, Epay6, Epay7
			};
			if (parentDeviceRowByFK_Device_Log != null)
			{
				array[0] = parentDeviceRowByFK_Device_Log[0];
			}
			logRow.ItemArray = array;
			base.Rows.Add(logRow);
			return logRow;
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public LogRow FindByMACFID(string MAC, int FID)
		{
			return (LogRow)base.Rows.Find(new object[2] { MAC, FID });
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
			LogDataTable logDataTable = (LogDataTable)base.Clone();
			logDataTable.InitVars();
			return logDataTable;
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		protected override DataTable CreateInstance()
		{
			return new LogDataTable();
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		internal void InitVars()
		{
			columnMAC = base.Columns["MAC"];
			columnFID = base.Columns["FID"];
			columnDateTime = base.Columns["DateTime"];
			columnSID = base.Columns["SID"];
			columnSalesman = base.Columns["Salesman"];
			columnDisRound = base.Columns["DisRound"];
			columnSfee = base.Columns["Sfee"];
			columnPayment_Card = base.Columns["Payment_Card"];
			columnPayment_Other_1 = base.Columns["Payment_Other_1"];
			columnPayment_Other_2 = base.Columns["Payment_Other_2"];
			columnPayment_Other_3 = base.Columns["Payment_Other_3"];
			columnPayment_Total = base.Columns["Payment_Total"];
			columnTax = base.Columns["Tax"];
			columnCost = base.Columns["Cost"];
			columnSubNo = base.Columns["SubNo"];
			columnAlipay = base.Columns["Alipay"];
			columnWXpay = base.Columns["WXpay"];
			columnEpay2 = base.Columns["Epay2"];
			columnEpay3 = base.Columns["Epay3"];
			columnEpay4 = base.Columns["Epay4"];
			columnEpay5 = base.Columns["Epay5"];
			columnEpay6 = base.Columns["Epay6"];
			columnEpay7 = base.Columns["Epay7"];
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		private void InitClass()
		{
			columnMAC = new DataColumn("MAC", typeof(string), null, MappingType.Element);
			base.Columns.Add(columnMAC);
			columnFID = new DataColumn("FID", typeof(int), null, MappingType.Element);
			base.Columns.Add(columnFID);
			columnDateTime = new DataColumn("DateTime", typeof(DateTime), null, MappingType.Element);
			base.Columns.Add(columnDateTime);
			columnSID = new DataColumn("SID", typeof(int), null, MappingType.Element);
			base.Columns.Add(columnSID);
			columnSalesman = new DataColumn("Salesman", typeof(int), null, MappingType.Element);
			base.Columns.Add(columnSalesman);
			columnDisRound = new DataColumn("DisRound", typeof(decimal), null, MappingType.Element);
			base.Columns.Add(columnDisRound);
			columnSfee = new DataColumn("Sfee", typeof(decimal), null, MappingType.Element);
			base.Columns.Add(columnSfee);
			columnPayment_Card = new DataColumn("Payment_Card", typeof(decimal), null, MappingType.Element);
			base.Columns.Add(columnPayment_Card);
			columnPayment_Other_1 = new DataColumn("Payment_Other_1", typeof(decimal), null, MappingType.Element);
			base.Columns.Add(columnPayment_Other_1);
			columnPayment_Other_2 = new DataColumn("Payment_Other_2", typeof(decimal), null, MappingType.Element);
			base.Columns.Add(columnPayment_Other_2);
			columnPayment_Other_3 = new DataColumn("Payment_Other_3", typeof(decimal), null, MappingType.Element);
			base.Columns.Add(columnPayment_Other_3);
			columnPayment_Total = new DataColumn("Payment_Total", typeof(decimal), null, MappingType.Element);
			base.Columns.Add(columnPayment_Total);
			columnTax = new DataColumn("Tax", typeof(decimal), null, MappingType.Element);
			base.Columns.Add(columnTax);
			columnCost = new DataColumn("Cost", typeof(decimal), null, MappingType.Element);
			base.Columns.Add(columnCost);
			columnSubNo = new DataColumn("SubNo", typeof(int), null, MappingType.Element);
			base.Columns.Add(columnSubNo);
			columnAlipay = new DataColumn("Alipay", typeof(decimal), null, MappingType.Element);
			base.Columns.Add(columnAlipay);
			columnWXpay = new DataColumn("WXpay", typeof(decimal), null, MappingType.Element);
			base.Columns.Add(columnWXpay);
			columnEpay2 = new DataColumn("Epay2", typeof(decimal), null, MappingType.Element);
			base.Columns.Add(columnEpay2);
			columnEpay3 = new DataColumn("Epay3", typeof(decimal), null, MappingType.Element);
			base.Columns.Add(columnEpay3);
			columnEpay4 = new DataColumn("Epay4", typeof(decimal), null, MappingType.Element);
			base.Columns.Add(columnEpay4);
			columnEpay5 = new DataColumn("Epay5", typeof(decimal), null, MappingType.Element);
			base.Columns.Add(columnEpay5);
			columnEpay6 = new DataColumn("Epay6", typeof(decimal), null, MappingType.Element);
			base.Columns.Add(columnEpay6);
			columnEpay7 = new DataColumn("Epay7", typeof(decimal), null, MappingType.Element);
			base.Columns.Add(columnEpay7);
			base.Constraints.Add(new UniqueConstraint("Constraint2", new DataColumn[2] { columnMAC, columnFID }, isPrimaryKey: true));
			columnMAC.AllowDBNull = false;
			columnMAC.MaxLength = 50;
			columnFID.AllowDBNull = false;
			columnFID.DefaultValue = 0;
			columnDateTime.DefaultValue = columnDateTime_defaultValue;
			columnSID.DefaultValue = 0;
			columnSalesman.DefaultValue = 0;
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public LogRow NewLogRow()
		{
			return (LogRow)NewRow();
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		protected override DataRow NewRowFromBuilder(DataRowBuilder builder)
		{
			return new LogRow(builder);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		protected override Type GetRowType()
		{
			return typeof(LogRow);
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		protected override void OnRowChanged(DataRowChangeEventArgs e)
		{
			base.OnRowChanged(e);
			if (this.LogRowChanged != null)
			{
				this.LogRowChanged(this, new LogRowChangeEvent((LogRow)e.Row, e.Action));
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		protected override void OnRowChanging(DataRowChangeEventArgs e)
		{
			base.OnRowChanging(e);
			if (this.LogRowChanging != null)
			{
				this.LogRowChanging(this, new LogRowChangeEvent((LogRow)e.Row, e.Action));
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		protected override void OnRowDeleted(DataRowChangeEventArgs e)
		{
			base.OnRowDeleted(e);
			if (this.LogRowDeleted != null)
			{
				this.LogRowDeleted(this, new LogRowChangeEvent((LogRow)e.Row, e.Action));
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		protected override void OnRowDeleting(DataRowChangeEventArgs e)
		{
			base.OnRowDeleting(e);
			if (this.LogRowDeleting != null)
			{
				this.LogRowDeleting(this, new LogRowChangeEvent((LogRow)e.Row, e.Action));
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public void RemoveLogRow(LogRow row)
		{
			base.Rows.Remove(row);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public static XmlSchemaComplexType GetTypedTableSchema(XmlSchemaSet xs)
		{
			XmlSchemaComplexType xmlSchemaComplexType = new XmlSchemaComplexType();
			XmlSchemaSequence xmlSchemaSequence = new XmlSchemaSequence();
			ReportDataSet reportDataSet = new ReportDataSet();
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
			xmlSchemaAttribute.FixedValue = reportDataSet.Namespace;
			xmlSchemaComplexType.Attributes.Add(xmlSchemaAttribute);
			XmlSchemaAttribute xmlSchemaAttribute2 = new XmlSchemaAttribute();
			xmlSchemaAttribute2.Name = "tableTypeName";
			xmlSchemaAttribute2.FixedValue = "LogDataTable";
			xmlSchemaComplexType.Attributes.Add(xmlSchemaAttribute2);
			xmlSchemaComplexType.Particle = xmlSchemaSequence;
			XmlSchema schemaSerializable = reportDataSet.GetSchemaSerializable();
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
	public class LogItemDataTable : DataTable, IEnumerable
	{
		private DataColumn columnMAC;

		private DataColumn columnFID;

		private DataColumn columnSubID;

		private DataColumn columnPrice;

		private DataColumn columnPLU;

		private DataColumn columnClass;

		private DataColumn columnDept;

		private DataColumn columnCost;

		private DataColumn columnAmount;

		private DataColumn columnUnit;

		private DataColumn columnType;

		private DataColumn columnTax;

		private DataColumn columnText1;

		private DataColumn columnText2;

		private DataColumn columnText3;

		private DataColumn columnText4;

		private DataColumn columnUnitPrice;

		private DataColumn columnCoFID;

		private DataColumn columnPLUName;

		private DataColumn columnDateTime;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public DataColumn MACColumn => columnMAC;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public DataColumn FIDColumn => columnFID;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public DataColumn SubIDColumn => columnSubID;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public DataColumn PriceColumn => columnPrice;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public DataColumn PLUColumn => columnPLU;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public DataColumn ClassColumn => columnClass;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public DataColumn DeptColumn => columnDept;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public DataColumn CostColumn => columnCost;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public DataColumn AmountColumn => columnAmount;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public DataColumn UnitColumn => columnUnit;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public DataColumn TypeColumn => columnType;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public DataColumn TaxColumn => columnTax;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public DataColumn Text1Column => columnText1;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public DataColumn Text2Column => columnText2;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public DataColumn Text3Column => columnText3;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public DataColumn Text4Column => columnText4;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public DataColumn UnitPriceColumn => columnUnitPrice;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public DataColumn CoFIDColumn => columnCoFID;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public DataColumn PLUNameColumn => columnPLUName;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public DataColumn DateTimeColumn => columnDateTime;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[Browsable(false)]
		public int Count => base.Rows.Count;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public LogItemRow this[int index] => (LogItemRow)base.Rows[index];

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public event LogItemRowChangeEventHandler LogItemRowChanging;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public event LogItemRowChangeEventHandler LogItemRowChanged;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public event LogItemRowChangeEventHandler LogItemRowDeleting;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public event LogItemRowChangeEventHandler LogItemRowDeleted;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public LogItemDataTable()
		{
			base.TableName = "LogItem";
			BeginInit();
			InitClass();
			EndInit();
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		internal LogItemDataTable(DataTable table)
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
		protected LogItemDataTable(SerializationInfo info, StreamingContext context)
			: base(info, context)
		{
			InitVars();
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public void AddLogItemRow(LogItemRow row)
		{
			base.Rows.Add(row);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public LogItemRow AddLogItemRow(string MAC, int SubID, decimal Price, int PLU, int Class, int Dept, decimal Cost, decimal Amount, int Unit, int Type, decimal Tax, string Text1, string Text2, string Text3, string Text4, decimal UnitPrice, int CoFID, string PLUName, DateTime DateTime)
		{
			LogItemRow logItemRow = (LogItemRow)NewRow();
			object[] itemArray = new object[20]
			{
				MAC, null, SubID, Price, PLU, Class, Dept, Cost, Amount, Unit,
				Type, Tax, Text1, Text2, Text3, Text4, UnitPrice, CoFID, PLUName, DateTime
			};
			logItemRow.ItemArray = itemArray;
			base.Rows.Add(logItemRow);
			return logItemRow;
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public LogItemRow FindBySubIDFIDMAC(int SubID, int FID, string MAC)
		{
			return (LogItemRow)base.Rows.Find(new object[3] { SubID, FID, MAC });
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
			LogItemDataTable logItemDataTable = (LogItemDataTable)base.Clone();
			logItemDataTable.InitVars();
			return logItemDataTable;
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		protected override DataTable CreateInstance()
		{
			return new LogItemDataTable();
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		internal void InitVars()
		{
			columnMAC = base.Columns["MAC"];
			columnFID = base.Columns["FID"];
			columnSubID = base.Columns["SubID"];
			columnPrice = base.Columns["Price"];
			columnPLU = base.Columns["PLU"];
			columnClass = base.Columns["Class"];
			columnDept = base.Columns["Dept"];
			columnCost = base.Columns["Cost"];
			columnAmount = base.Columns["Amount"];
			columnUnit = base.Columns["Unit"];
			columnType = base.Columns["Type"];
			columnTax = base.Columns["Tax"];
			columnText1 = base.Columns["Text1"];
			columnText2 = base.Columns["Text2"];
			columnText3 = base.Columns["Text3"];
			columnText4 = base.Columns["Text4"];
			columnUnitPrice = base.Columns["UnitPrice"];
			columnCoFID = base.Columns["CoFID"];
			columnPLUName = base.Columns["PLUName"];
			columnDateTime = base.Columns["DateTime"];
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		private void InitClass()
		{
			columnMAC = new DataColumn("MAC", typeof(string), null, MappingType.Element);
			base.Columns.Add(columnMAC);
			columnFID = new DataColumn("FID", typeof(int), null, MappingType.Element);
			base.Columns.Add(columnFID);
			columnSubID = new DataColumn("SubID", typeof(int), null, MappingType.Element);
			base.Columns.Add(columnSubID);
			columnPrice = new DataColumn("Price", typeof(decimal), null, MappingType.Element);
			base.Columns.Add(columnPrice);
			columnPLU = new DataColumn("PLU", typeof(int), null, MappingType.Element);
			base.Columns.Add(columnPLU);
			columnClass = new DataColumn("Class", typeof(int), null, MappingType.Element);
			base.Columns.Add(columnClass);
			columnDept = new DataColumn("Dept", typeof(int), null, MappingType.Element);
			base.Columns.Add(columnDept);
			columnCost = new DataColumn("Cost", typeof(decimal), null, MappingType.Element);
			base.Columns.Add(columnCost);
			columnAmount = new DataColumn("Amount", typeof(decimal), null, MappingType.Element);
			base.Columns.Add(columnAmount);
			columnUnit = new DataColumn("Unit", typeof(int), null, MappingType.Element);
			base.Columns.Add(columnUnit);
			columnType = new DataColumn("Type", typeof(int), null, MappingType.Element);
			base.Columns.Add(columnType);
			columnTax = new DataColumn("Tax", typeof(decimal), null, MappingType.Element);
			base.Columns.Add(columnTax);
			columnText1 = new DataColumn("Text1", typeof(string), null, MappingType.Element);
			base.Columns.Add(columnText1);
			columnText2 = new DataColumn("Text2", typeof(string), null, MappingType.Element);
			base.Columns.Add(columnText2);
			columnText3 = new DataColumn("Text3", typeof(string), null, MappingType.Element);
			base.Columns.Add(columnText3);
			columnText4 = new DataColumn("Text4", typeof(string), null, MappingType.Element);
			base.Columns.Add(columnText4);
			columnUnitPrice = new DataColumn("UnitPrice", typeof(decimal), null, MappingType.Element);
			base.Columns.Add(columnUnitPrice);
			columnCoFID = new DataColumn("CoFID", typeof(int), null, MappingType.Element);
			base.Columns.Add(columnCoFID);
			columnPLUName = new DataColumn("PLUName", typeof(string), null, MappingType.Element);
			base.Columns.Add(columnPLUName);
			columnDateTime = new DataColumn("DateTime", typeof(DateTime), null, MappingType.Element);
			base.Columns.Add(columnDateTime);
			base.Constraints.Add(new UniqueConstraint("Constraint1", new DataColumn[3] { columnSubID, columnFID, columnMAC }, isPrimaryKey: true));
			columnMAC.AllowDBNull = false;
			columnMAC.MaxLength = 255;
			columnFID.AutoIncrement = true;
			columnFID.AutoIncrementSeed = 1L;
			columnFID.AllowDBNull = false;
			columnSubID.AllowDBNull = false;
			columnText1.MaxLength = 255;
			columnText2.MaxLength = 255;
			columnText3.MaxLength = 255;
			columnText4.MaxLength = 255;
			columnPLUName.MaxLength = 255;
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public LogItemRow NewLogItemRow()
		{
			return (LogItemRow)NewRow();
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		protected override DataRow NewRowFromBuilder(DataRowBuilder builder)
		{
			return new LogItemRow(builder);
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		protected override Type GetRowType()
		{
			return typeof(LogItemRow);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		protected override void OnRowChanged(DataRowChangeEventArgs e)
		{
			base.OnRowChanged(e);
			if (this.LogItemRowChanged != null)
			{
				this.LogItemRowChanged(this, new LogItemRowChangeEvent((LogItemRow)e.Row, e.Action));
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		protected override void OnRowChanging(DataRowChangeEventArgs e)
		{
			base.OnRowChanging(e);
			if (this.LogItemRowChanging != null)
			{
				this.LogItemRowChanging(this, new LogItemRowChangeEvent((LogItemRow)e.Row, e.Action));
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		protected override void OnRowDeleted(DataRowChangeEventArgs e)
		{
			base.OnRowDeleted(e);
			if (this.LogItemRowDeleted != null)
			{
				this.LogItemRowDeleted(this, new LogItemRowChangeEvent((LogItemRow)e.Row, e.Action));
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		protected override void OnRowDeleting(DataRowChangeEventArgs e)
		{
			base.OnRowDeleting(e);
			if (this.LogItemRowDeleting != null)
			{
				this.LogItemRowDeleting(this, new LogItemRowChangeEvent((LogItemRow)e.Row, e.Action));
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public void RemoveLogItemRow(LogItemRow row)
		{
			base.Rows.Remove(row);
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public static XmlSchemaComplexType GetTypedTableSchema(XmlSchemaSet xs)
		{
			XmlSchemaComplexType xmlSchemaComplexType = new XmlSchemaComplexType();
			XmlSchemaSequence xmlSchemaSequence = new XmlSchemaSequence();
			ReportDataSet reportDataSet = new ReportDataSet();
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
			xmlSchemaAttribute.FixedValue = reportDataSet.Namespace;
			xmlSchemaComplexType.Attributes.Add(xmlSchemaAttribute);
			XmlSchemaAttribute xmlSchemaAttribute2 = new XmlSchemaAttribute();
			xmlSchemaAttribute2.Name = "tableTypeName";
			xmlSchemaAttribute2.FixedValue = "LogItemDataTable";
			xmlSchemaComplexType.Attributes.Add(xmlSchemaAttribute2);
			xmlSchemaComplexType.Particle = xmlSchemaSequence;
			XmlSchema schemaSerializable = reportDataSet.GetSchemaSerializable();
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
	public class SGroupDataTable : DataTable, IEnumerable
	{
		private DataColumn columnGID;

		private DataColumn columnName;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public DataColumn GIDColumn => columnGID;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public DataColumn NameColumn => columnName;

		[Browsable(false)]
		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public int Count => base.Rows.Count;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public SGroupRow this[int index] => (SGroupRow)base.Rows[index];

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public event SGroupRowChangeEventHandler SGroupRowChanging;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public event SGroupRowChangeEventHandler SGroupRowChanged;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public event SGroupRowChangeEventHandler SGroupRowDeleting;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public event SGroupRowChangeEventHandler SGroupRowDeleted;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public SGroupDataTable()
		{
			base.TableName = "SGroup";
			BeginInit();
			InitClass();
			EndInit();
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		internal SGroupDataTable(DataTable table)
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
		protected SGroupDataTable(SerializationInfo info, StreamingContext context)
			: base(info, context)
		{
			InitVars();
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public void AddSGroupRow(SGroupRow row)
		{
			base.Rows.Add(row);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public SGroupRow AddSGroupRow(int GID, string Name)
		{
			SGroupRow sGroupRow = (SGroupRow)NewRow();
			object[] itemArray = new object[2] { GID, Name };
			sGroupRow.ItemArray = itemArray;
			base.Rows.Add(sGroupRow);
			return sGroupRow;
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public SGroupRow FindByGID(int GID)
		{
			return (SGroupRow)base.Rows.Find(new object[1] { GID });
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
			SGroupDataTable sGroupDataTable = (SGroupDataTable)base.Clone();
			sGroupDataTable.InitVars();
			return sGroupDataTable;
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		protected override DataTable CreateInstance()
		{
			return new SGroupDataTable();
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		internal void InitVars()
		{
			columnGID = base.Columns["GID"];
			columnName = base.Columns["Name"];
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		private void InitClass()
		{
			columnGID = new DataColumn("GID", typeof(int), null, MappingType.Element);
			base.Columns.Add(columnGID);
			columnName = new DataColumn("Name", typeof(string), null, MappingType.Element);
			base.Columns.Add(columnName);
			base.Constraints.Add(new UniqueConstraint("Constraint1", new DataColumn[1] { columnGID }, isPrimaryKey: true));
			columnGID.AllowDBNull = false;
			columnGID.Unique = true;
			columnName.MaxLength = 255;
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public SGroupRow NewSGroupRow()
		{
			return (SGroupRow)NewRow();
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		protected override DataRow NewRowFromBuilder(DataRowBuilder builder)
		{
			return new SGroupRow(builder);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		protected override Type GetRowType()
		{
			return typeof(SGroupRow);
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		protected override void OnRowChanged(DataRowChangeEventArgs e)
		{
			base.OnRowChanged(e);
			if (this.SGroupRowChanged != null)
			{
				this.SGroupRowChanged(this, new SGroupRowChangeEvent((SGroupRow)e.Row, e.Action));
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		protected override void OnRowChanging(DataRowChangeEventArgs e)
		{
			base.OnRowChanging(e);
			if (this.SGroupRowChanging != null)
			{
				this.SGroupRowChanging(this, new SGroupRowChangeEvent((SGroupRow)e.Row, e.Action));
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		protected override void OnRowDeleted(DataRowChangeEventArgs e)
		{
			base.OnRowDeleted(e);
			if (this.SGroupRowDeleted != null)
			{
				this.SGroupRowDeleted(this, new SGroupRowChangeEvent((SGroupRow)e.Row, e.Action));
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		protected override void OnRowDeleting(DataRowChangeEventArgs e)
		{
			base.OnRowDeleting(e);
			if (this.SGroupRowDeleting != null)
			{
				this.SGroupRowDeleting(this, new SGroupRowChangeEvent((SGroupRow)e.Row, e.Action));
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public void RemoveSGroupRow(SGroupRow row)
		{
			base.Rows.Remove(row);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public static XmlSchemaComplexType GetTypedTableSchema(XmlSchemaSet xs)
		{
			XmlSchemaComplexType xmlSchemaComplexType = new XmlSchemaComplexType();
			XmlSchemaSequence xmlSchemaSequence = new XmlSchemaSequence();
			ReportDataSet reportDataSet = new ReportDataSet();
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
			xmlSchemaAttribute.FixedValue = reportDataSet.Namespace;
			xmlSchemaComplexType.Attributes.Add(xmlSchemaAttribute);
			XmlSchemaAttribute xmlSchemaAttribute2 = new XmlSchemaAttribute();
			xmlSchemaAttribute2.Name = "tableTypeName";
			xmlSchemaAttribute2.FixedValue = "SGroupDataTable";
			xmlSchemaComplexType.Attributes.Add(xmlSchemaAttribute2);
			xmlSchemaComplexType.Particle = xmlSchemaSequence;
			XmlSchema schemaSerializable = reportDataSet.GetSchemaSerializable();
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
	public class StockDataTable : DataTable, IEnumerable
	{
		private DataColumn columnGID;

		private DataColumn columnPLU;

		private DataColumn columnSTakingTime;

		private DataColumn columnAmount;

		private DataColumn columnUnit;

		private DataColumn columnIn_Amount;

		private DataColumn columnSpoilage;

		private DataColumn columnAmountSP;

		private DataColumn columnUnitSP;

		private DataColumn columnIn_AmountSP;

		private DataColumn columnSpoilageSP;

		private DataColumn columnIn_Money;

		private DataColumn columnSped;

		private DataColumn columnSafetyStock;

		private DataColumn columnLowStock;

		private DataColumn columnOrder;

		private DataColumn columnKID;

		private DataColumn columnKID_Time;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public DataColumn GIDColumn => columnGID;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public DataColumn PLUColumn => columnPLU;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public DataColumn STakingTimeColumn => columnSTakingTime;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public DataColumn AmountColumn => columnAmount;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public DataColumn UnitColumn => columnUnit;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public DataColumn In_AmountColumn => columnIn_Amount;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public DataColumn SpoilageColumn => columnSpoilage;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public DataColumn AmountSPColumn => columnAmountSP;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public DataColumn UnitSPColumn => columnUnitSP;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public DataColumn In_AmountSPColumn => columnIn_AmountSP;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public DataColumn SpoilageSPColumn => columnSpoilageSP;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public DataColumn In_MoneyColumn => columnIn_Money;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public DataColumn SpedColumn => columnSped;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public DataColumn SafetyStockColumn => columnSafetyStock;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public DataColumn LowStockColumn => columnLowStock;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public DataColumn OrderColumn => columnOrder;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public DataColumn KIDColumn => columnKID;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public DataColumn KID_TimeColumn => columnKID_Time;

		[Browsable(false)]
		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public int Count => base.Rows.Count;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public StockRow this[int index] => (StockRow)base.Rows[index];

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public event StockRowChangeEventHandler StockRowChanging;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public event StockRowChangeEventHandler StockRowChanged;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public event StockRowChangeEventHandler StockRowDeleting;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public event StockRowChangeEventHandler StockRowDeleted;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public StockDataTable()
		{
			base.TableName = "Stock";
			BeginInit();
			InitClass();
			EndInit();
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		internal StockDataTable(DataTable table)
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
		protected StockDataTable(SerializationInfo info, StreamingContext context)
			: base(info, context)
		{
			InitVars();
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public void AddStockRow(StockRow row)
		{
			base.Rows.Add(row);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public StockRow AddStockRow(SGroupRow parentSGroupRowByFK_SGroup_Stock, int PLU, DateTime STakingTime, decimal Amount, int Unit, decimal In_Amount, decimal Spoilage, decimal AmountSP, int UnitSP, decimal In_AmountSP, decimal SpoilageSP, decimal In_Money, bool Sped, decimal SafetyStock, bool LowStock, decimal Order, int KID, DateTime KID_Time)
		{
			StockRow stockRow = (StockRow)NewRow();
			object[] array = new object[18]
			{
				null, PLU, STakingTime, Amount, Unit, In_Amount, Spoilage, AmountSP, UnitSP, In_AmountSP,
				SpoilageSP, In_Money, Sped, SafetyStock, LowStock, Order, KID, KID_Time
			};
			if (parentSGroupRowByFK_SGroup_Stock != null)
			{
				array[0] = parentSGroupRowByFK_SGroup_Stock[0];
			}
			stockRow.ItemArray = array;
			base.Rows.Add(stockRow);
			return stockRow;
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public StockRow FindByGIDPLU(int GID, int PLU)
		{
			return (StockRow)base.Rows.Find(new object[2] { GID, PLU });
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
			StockDataTable stockDataTable = (StockDataTable)base.Clone();
			stockDataTable.InitVars();
			return stockDataTable;
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		protected override DataTable CreateInstance()
		{
			return new StockDataTable();
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		internal void InitVars()
		{
			columnGID = base.Columns["GID"];
			columnPLU = base.Columns["PLU"];
			columnSTakingTime = base.Columns["STakingTime"];
			columnAmount = base.Columns["Amount"];
			columnUnit = base.Columns["Unit"];
			columnIn_Amount = base.Columns["In_Amount"];
			columnSpoilage = base.Columns["Spoilage"];
			columnAmountSP = base.Columns["AmountSP"];
			columnUnitSP = base.Columns["UnitSP"];
			columnIn_AmountSP = base.Columns["In_AmountSP"];
			columnSpoilageSP = base.Columns["SpoilageSP"];
			columnIn_Money = base.Columns["In_Money"];
			columnSped = base.Columns["Sped"];
			columnSafetyStock = base.Columns["SafetyStock"];
			columnLowStock = base.Columns["LowStock"];
			columnOrder = base.Columns["Order"];
			columnKID = base.Columns["KID"];
			columnKID_Time = base.Columns["KID_Time"];
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		private void InitClass()
		{
			columnGID = new DataColumn("GID", typeof(int), null, MappingType.Element);
			base.Columns.Add(columnGID);
			columnPLU = new DataColumn("PLU", typeof(int), null, MappingType.Element);
			base.Columns.Add(columnPLU);
			columnSTakingTime = new DataColumn("STakingTime", typeof(DateTime), null, MappingType.Element);
			base.Columns.Add(columnSTakingTime);
			columnAmount = new DataColumn("Amount", typeof(decimal), null, MappingType.Element);
			base.Columns.Add(columnAmount);
			columnUnit = new DataColumn("Unit", typeof(int), null, MappingType.Element);
			base.Columns.Add(columnUnit);
			columnIn_Amount = new DataColumn("In_Amount", typeof(decimal), null, MappingType.Element);
			base.Columns.Add(columnIn_Amount);
			columnSpoilage = new DataColumn("Spoilage", typeof(decimal), null, MappingType.Element);
			base.Columns.Add(columnSpoilage);
			columnAmountSP = new DataColumn("AmountSP", typeof(decimal), null, MappingType.Element);
			base.Columns.Add(columnAmountSP);
			columnUnitSP = new DataColumn("UnitSP", typeof(int), null, MappingType.Element);
			base.Columns.Add(columnUnitSP);
			columnIn_AmountSP = new DataColumn("In_AmountSP", typeof(decimal), null, MappingType.Element);
			base.Columns.Add(columnIn_AmountSP);
			columnSpoilageSP = new DataColumn("SpoilageSP", typeof(decimal), null, MappingType.Element);
			base.Columns.Add(columnSpoilageSP);
			columnIn_Money = new DataColumn("In_Money", typeof(decimal), null, MappingType.Element);
			base.Columns.Add(columnIn_Money);
			columnSped = new DataColumn("Sped", typeof(bool), null, MappingType.Element);
			base.Columns.Add(columnSped);
			columnSafetyStock = new DataColumn("SafetyStock", typeof(decimal), null, MappingType.Element);
			base.Columns.Add(columnSafetyStock);
			columnLowStock = new DataColumn("LowStock", typeof(bool), null, MappingType.Element);
			base.Columns.Add(columnLowStock);
			columnOrder = new DataColumn("Order", typeof(decimal), null, MappingType.Element);
			base.Columns.Add(columnOrder);
			columnKID = new DataColumn("KID", typeof(int), null, MappingType.Element);
			base.Columns.Add(columnKID);
			columnKID_Time = new DataColumn("KID_Time", typeof(DateTime), null, MappingType.Element);
			base.Columns.Add(columnKID_Time);
			base.Constraints.Add(new UniqueConstraint("Constraint1", new DataColumn[2] { columnGID, columnPLU }, isPrimaryKey: true));
			columnGID.AllowDBNull = false;
			columnPLU.AllowDBNull = false;
			columnSped.DefaultValue = false;
			columnSafetyStock.DefaultValue = 0m;
			columnOrder.DefaultValue = 0m;
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public StockRow NewStockRow()
		{
			return (StockRow)NewRow();
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		protected override DataRow NewRowFromBuilder(DataRowBuilder builder)
		{
			return new StockRow(builder);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		protected override Type GetRowType()
		{
			return typeof(StockRow);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		protected override void OnRowChanged(DataRowChangeEventArgs e)
		{
			base.OnRowChanged(e);
			if (this.StockRowChanged != null)
			{
				this.StockRowChanged(this, new StockRowChangeEvent((StockRow)e.Row, e.Action));
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		protected override void OnRowChanging(DataRowChangeEventArgs e)
		{
			base.OnRowChanging(e);
			if (this.StockRowChanging != null)
			{
				this.StockRowChanging(this, new StockRowChangeEvent((StockRow)e.Row, e.Action));
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		protected override void OnRowDeleted(DataRowChangeEventArgs e)
		{
			base.OnRowDeleted(e);
			if (this.StockRowDeleted != null)
			{
				this.StockRowDeleted(this, new StockRowChangeEvent((StockRow)e.Row, e.Action));
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		protected override void OnRowDeleting(DataRowChangeEventArgs e)
		{
			base.OnRowDeleting(e);
			if (this.StockRowDeleting != null)
			{
				this.StockRowDeleting(this, new StockRowChangeEvent((StockRow)e.Row, e.Action));
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public void RemoveStockRow(StockRow row)
		{
			base.Rows.Remove(row);
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public static XmlSchemaComplexType GetTypedTableSchema(XmlSchemaSet xs)
		{
			XmlSchemaComplexType xmlSchemaComplexType = new XmlSchemaComplexType();
			XmlSchemaSequence xmlSchemaSequence = new XmlSchemaSequence();
			ReportDataSet reportDataSet = new ReportDataSet();
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
			xmlSchemaAttribute.FixedValue = reportDataSet.Namespace;
			xmlSchemaComplexType.Attributes.Add(xmlSchemaAttribute);
			XmlSchemaAttribute xmlSchemaAttribute2 = new XmlSchemaAttribute();
			xmlSchemaAttribute2.Name = "tableTypeName";
			xmlSchemaAttribute2.FixedValue = "StockDataTable";
			xmlSchemaComplexType.Attributes.Add(xmlSchemaAttribute2);
			xmlSchemaComplexType.Particle = xmlSchemaSequence;
			XmlSchema schemaSerializable = reportDataSet.GetSchemaSerializable();
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
	public class StockItemDataTable : DataTable, IEnumerable
	{
		private DataColumn columnKID;

		private DataColumn columnGID;

		private DataColumn columnMAC;

		private DataColumn columnFID;

		private DataColumn columnDateTime;

		private DataColumn columnPrice;

		private DataColumn columnPLU;

		private DataColumn columnAmount;

		private DataColumn columnUnit;

		private DataColumn columnType;

		private DataColumn columnUnitPrice;

		private DataColumn columnSubID;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public DataColumn KIDColumn => columnKID;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public DataColumn GIDColumn => columnGID;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public DataColumn MACColumn => columnMAC;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public DataColumn FIDColumn => columnFID;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public DataColumn DateTimeColumn => columnDateTime;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public DataColumn PriceColumn => columnPrice;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public DataColumn PLUColumn => columnPLU;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public DataColumn AmountColumn => columnAmount;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public DataColumn UnitColumn => columnUnit;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public DataColumn TypeColumn => columnType;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public DataColumn UnitPriceColumn => columnUnitPrice;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public DataColumn SubIDColumn => columnSubID;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[Browsable(false)]
		public int Count => base.Rows.Count;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public StockItemRow this[int index] => (StockItemRow)base.Rows[index];

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public event StockItemRowChangeEventHandler StockItemRowChanging;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public event StockItemRowChangeEventHandler StockItemRowChanged;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public event StockItemRowChangeEventHandler StockItemRowDeleting;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public event StockItemRowChangeEventHandler StockItemRowDeleted;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public StockItemDataTable()
		{
			base.TableName = "StockItem";
			BeginInit();
			InitClass();
			EndInit();
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		internal StockItemDataTable(DataTable table)
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
		protected StockItemDataTable(SerializationInfo info, StreamingContext context)
			: base(info, context)
		{
			InitVars();
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public void AddStockItemRow(StockItemRow row)
		{
			base.Rows.Add(row);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public StockItemRow AddStockItemRow(SGroupRow parentSGroupRowByFK_SGroup_StockItem, string MAC, int FID, DateTime DateTime, decimal Price, int PLU, decimal Amount, int Unit, int Type, decimal UnitPrice, int SubID)
		{
			StockItemRow stockItemRow = (StockItemRow)NewRow();
			object[] array = new object[12]
			{
				null, null, MAC, FID, DateTime, Price, PLU, Amount, Unit, Type,
				UnitPrice, SubID
			};
			if (parentSGroupRowByFK_SGroup_StockItem != null)
			{
				array[1] = parentSGroupRowByFK_SGroup_StockItem[0];
			}
			stockItemRow.ItemArray = array;
			base.Rows.Add(stockItemRow);
			return stockItemRow;
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public StockItemRow FindByKID(int KID)
		{
			return (StockItemRow)base.Rows.Find(new object[1] { KID });
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
			StockItemDataTable stockItemDataTable = (StockItemDataTable)base.Clone();
			stockItemDataTable.InitVars();
			return stockItemDataTable;
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		protected override DataTable CreateInstance()
		{
			return new StockItemDataTable();
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		internal void InitVars()
		{
			columnKID = base.Columns["KID"];
			columnGID = base.Columns["GID"];
			columnMAC = base.Columns["MAC"];
			columnFID = base.Columns["FID"];
			columnDateTime = base.Columns["DateTime"];
			columnPrice = base.Columns["Price"];
			columnPLU = base.Columns["PLU"];
			columnAmount = base.Columns["Amount"];
			columnUnit = base.Columns["Unit"];
			columnType = base.Columns["Type"];
			columnUnitPrice = base.Columns["UnitPrice"];
			columnSubID = base.Columns["SubID"];
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		private void InitClass()
		{
			columnKID = new DataColumn("KID", typeof(int), null, MappingType.Element);
			base.Columns.Add(columnKID);
			columnGID = new DataColumn("GID", typeof(int), null, MappingType.Element);
			base.Columns.Add(columnGID);
			columnMAC = new DataColumn("MAC", typeof(string), null, MappingType.Element);
			base.Columns.Add(columnMAC);
			columnFID = new DataColumn("FID", typeof(int), null, MappingType.Element);
			base.Columns.Add(columnFID);
			columnDateTime = new DataColumn("DateTime", typeof(DateTime), null, MappingType.Element);
			base.Columns.Add(columnDateTime);
			columnPrice = new DataColumn("Price", typeof(decimal), null, MappingType.Element);
			base.Columns.Add(columnPrice);
			columnPLU = new DataColumn("PLU", typeof(int), null, MappingType.Element);
			base.Columns.Add(columnPLU);
			columnAmount = new DataColumn("Amount", typeof(decimal), null, MappingType.Element);
			base.Columns.Add(columnAmount);
			columnUnit = new DataColumn("Unit", typeof(int), null, MappingType.Element);
			base.Columns.Add(columnUnit);
			columnType = new DataColumn("Type", typeof(int), null, MappingType.Element);
			base.Columns.Add(columnType);
			columnUnitPrice = new DataColumn("UnitPrice", typeof(decimal), null, MappingType.Element);
			base.Columns.Add(columnUnitPrice);
			columnSubID = new DataColumn("SubID", typeof(int), null, MappingType.Element);
			base.Columns.Add(columnSubID);
			base.Constraints.Add(new UniqueConstraint("Constraint1", new DataColumn[1] { columnKID }, isPrimaryKey: true));
			columnKID.AutoIncrement = true;
			columnKID.AllowDBNull = false;
			columnKID.Unique = true;
			columnMAC.MaxLength = 50;
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public StockItemRow NewStockItemRow()
		{
			return (StockItemRow)NewRow();
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		protected override DataRow NewRowFromBuilder(DataRowBuilder builder)
		{
			return new StockItemRow(builder);
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		protected override Type GetRowType()
		{
			return typeof(StockItemRow);
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		protected override void OnRowChanged(DataRowChangeEventArgs e)
		{
			base.OnRowChanged(e);
			if (this.StockItemRowChanged != null)
			{
				this.StockItemRowChanged(this, new StockItemRowChangeEvent((StockItemRow)e.Row, e.Action));
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		protected override void OnRowChanging(DataRowChangeEventArgs e)
		{
			base.OnRowChanging(e);
			if (this.StockItemRowChanging != null)
			{
				this.StockItemRowChanging(this, new StockItemRowChangeEvent((StockItemRow)e.Row, e.Action));
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		protected override void OnRowDeleted(DataRowChangeEventArgs e)
		{
			base.OnRowDeleted(e);
			if (this.StockItemRowDeleted != null)
			{
				this.StockItemRowDeleted(this, new StockItemRowChangeEvent((StockItemRow)e.Row, e.Action));
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		protected override void OnRowDeleting(DataRowChangeEventArgs e)
		{
			base.OnRowDeleting(e);
			if (this.StockItemRowDeleting != null)
			{
				this.StockItemRowDeleting(this, new StockItemRowChangeEvent((StockItemRow)e.Row, e.Action));
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public void RemoveStockItemRow(StockItemRow row)
		{
			base.Rows.Remove(row);
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public static XmlSchemaComplexType GetTypedTableSchema(XmlSchemaSet xs)
		{
			XmlSchemaComplexType xmlSchemaComplexType = new XmlSchemaComplexType();
			XmlSchemaSequence xmlSchemaSequence = new XmlSchemaSequence();
			ReportDataSet reportDataSet = new ReportDataSet();
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
			xmlSchemaAttribute.FixedValue = reportDataSet.Namespace;
			xmlSchemaComplexType.Attributes.Add(xmlSchemaAttribute);
			XmlSchemaAttribute xmlSchemaAttribute2 = new XmlSchemaAttribute();
			xmlSchemaAttribute2.Name = "tableTypeName";
			xmlSchemaAttribute2.FixedValue = "StockItemDataTable";
			xmlSchemaComplexType.Attributes.Add(xmlSchemaAttribute2);
			xmlSchemaComplexType.Particle = xmlSchemaSequence;
			XmlSchema schemaSerializable = reportDataSet.GetSchemaSerializable();
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
	public class rPLUDataTable : DataTable, IEnumerable
	{
		private DataColumn columnPLUID;

		private DataColumn columnValid;

		private DataColumn columnRemark;

		private DataColumn columnIndex;

		private DataColumn columnUnitID;

		private DataColumn columnPrice;

		private DataColumn columnCost;

		private DataColumn columnTare;

		private DataColumn columnBarF1;

		private DataColumn columnBarF2;

		private DataColumn columnBarT1;

		private DataColumn columnBarT2;

		private DataColumn columnLabelID1;

		private DataColumn columnLabelID2;

		private DataColumn columnClassID;

		private DataColumn columnPS_SD;

		private DataColumn columnPS_ST;

		private DataColumn columnPS_PD;

		private DataColumn columnPS_PT;

		private DataColumn columnPS_UD;

		private DataColumn columnPC_SD;

		private DataColumn columnPC_ST;

		private DataColumn columnPC_PD;

		private DataColumn columnPC_PT;

		private DataColumn columnPC_UD;

		private DataColumn columnDF_U;

		private DataColumn columnDF_D;

		private DataColumn columnDF_UN;

		private DataColumn columnDF_DN;

		private DataColumn columnDA_Sort1;

		private DataColumn columnDA_Day1;

		private DataColumn columnDA_Up1;

		private DataColumn columnDA_Dn1;

		private DataColumn columnDA_Num1;

		private DataColumn columnDA_Sort2;

		private DataColumn columnDA_Day2;

		private DataColumn columnDA_Up2;

		private DataColumn columnDA_Dn2;

		private DataColumn columnDA_Num2;

		private DataColumn columnDA_Sort3;

		private DataColumn columnDA_Day3;

		private DataColumn columnDA_Up3;

		private DataColumn columnDA_Dn3;

		private DataColumn columnDA_Num3;

		private DataColumn columnDA_Sort4;

		private DataColumn columnDA_Day4;

		private DataColumn columnDA_Up4;

		private DataColumn columnDA_Dn4;

		private DataColumn columnDA_Num4;

		private DataColumn columnName;

		private DataColumn columnText1;

		private DataColumn columnText2;

		private DataColumn columnText3;

		private DataColumn columnText4;

		private DataColumn columnText5;

		private DataColumn columnText6;

		private DataColumn columnText7;

		private DataColumn columnTaxType;

		private DataColumn columnTax;

		private DataColumn columnSspValue1;

		private DataColumn columnSspValue2;

		private DataColumn columnSspValue3;

		private DataColumn columnSspValue4;

		private DataColumn columnSType;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public DataColumn PLUIDColumn => columnPLUID;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public DataColumn ValidColumn => columnValid;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public DataColumn RemarkColumn => columnRemark;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public DataColumn IndexColumn => columnIndex;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public DataColumn UnitIDColumn => columnUnitID;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public DataColumn PriceColumn => columnPrice;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public DataColumn CostColumn => columnCost;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public DataColumn TareColumn => columnTare;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public DataColumn BarF1Column => columnBarF1;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public DataColumn BarF2Column => columnBarF2;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public DataColumn BarT1Column => columnBarT1;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public DataColumn BarT2Column => columnBarT2;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public DataColumn LabelID1Column => columnLabelID1;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public DataColumn LabelID2Column => columnLabelID2;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public DataColumn ClassIDColumn => columnClassID;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public DataColumn PS_SDColumn => columnPS_SD;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public DataColumn PS_STColumn => columnPS_ST;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public DataColumn PS_PDColumn => columnPS_PD;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public DataColumn PS_PTColumn => columnPS_PT;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public DataColumn PS_UDColumn => columnPS_UD;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public DataColumn PC_SDColumn => columnPC_SD;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public DataColumn PC_STColumn => columnPC_ST;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public DataColumn PC_PDColumn => columnPC_PD;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public DataColumn PC_PTColumn => columnPC_PT;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public DataColumn PC_UDColumn => columnPC_UD;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public DataColumn DF_UColumn => columnDF_U;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public DataColumn DF_DColumn => columnDF_D;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public DataColumn DF_UNColumn => columnDF_UN;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public DataColumn DF_DNColumn => columnDF_DN;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public DataColumn DA_Sort1Column => columnDA_Sort1;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public DataColumn DA_Day1Column => columnDA_Day1;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public DataColumn DA_Up1Column => columnDA_Up1;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public DataColumn DA_Dn1Column => columnDA_Dn1;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public DataColumn DA_Num1Column => columnDA_Num1;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public DataColumn DA_Sort2Column => columnDA_Sort2;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public DataColumn DA_Day2Column => columnDA_Day2;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public DataColumn DA_Up2Column => columnDA_Up2;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public DataColumn DA_Dn2Column => columnDA_Dn2;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public DataColumn DA_Num2Column => columnDA_Num2;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public DataColumn DA_Sort3Column => columnDA_Sort3;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public DataColumn DA_Day3Column => columnDA_Day3;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public DataColumn DA_Up3Column => columnDA_Up3;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public DataColumn DA_Dn3Column => columnDA_Dn3;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public DataColumn DA_Num3Column => columnDA_Num3;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public DataColumn DA_Sort4Column => columnDA_Sort4;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public DataColumn DA_Day4Column => columnDA_Day4;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public DataColumn DA_Up4Column => columnDA_Up4;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public DataColumn DA_Dn4Column => columnDA_Dn4;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public DataColumn DA_Num4Column => columnDA_Num4;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public DataColumn NameColumn => columnName;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public DataColumn Text1Column => columnText1;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public DataColumn Text2Column => columnText2;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public DataColumn Text3Column => columnText3;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public DataColumn Text4Column => columnText4;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public DataColumn Text5Column => columnText5;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public DataColumn Text6Column => columnText6;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public DataColumn Text7Column => columnText7;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public DataColumn TaxTypeColumn => columnTaxType;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public DataColumn TaxColumn => columnTax;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public DataColumn SspValue1Column => columnSspValue1;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public DataColumn SspValue2Column => columnSspValue2;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public DataColumn SspValue3Column => columnSspValue3;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public DataColumn SspValue4Column => columnSspValue4;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public DataColumn STypeColumn => columnSType;

		[Browsable(false)]
		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public int Count => base.Rows.Count;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public rPLURow this[int index] => (rPLURow)base.Rows[index];

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public event rPLURowChangeEventHandler rPLURowChanging;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public event rPLURowChangeEventHandler rPLURowChanged;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public event rPLURowChangeEventHandler rPLURowDeleting;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public event rPLURowChangeEventHandler rPLURowDeleted;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public rPLUDataTable()
		{
			base.TableName = "rPLU";
			BeginInit();
			InitClass();
			EndInit();
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		internal rPLUDataTable(DataTable table)
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
		protected rPLUDataTable(SerializationInfo info, StreamingContext context)
			: base(info, context)
		{
			InitVars();
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public void AddrPLURow(rPLURow row)
		{
			base.Rows.Add(row);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public rPLURow AddrPLURow(int PLUID, bool Valid, int Remark, string Index, int UnitID, decimal Price, decimal Cost, decimal Tare, int BarF1, int BarF2, int BarT1, int BarT2, int LabelID1, int LabelID2, int ClassID, int PS_SD, int PS_ST, int PS_PD, int PS_PT, int PS_UD, int PC_SD, int PC_ST, int PC_PD, int PC_PT, int PC_UD, int DF_U, int DF_D, decimal DF_UN, decimal DF_DN, int DA_Sort1, int DA_Day1, decimal DA_Up1, decimal DA_Dn1, decimal DA_Num1, int DA_Sort2, int DA_Day2, decimal DA_Up2, decimal DA_Dn2, decimal DA_Num2, int DA_Sort3, int DA_Day3, decimal DA_Up3, decimal DA_Dn3, decimal DA_Num3, int DA_Sort4, int DA_Day4, decimal DA_Up4, decimal DA_Dn4, decimal DA_Num4, string Name, string Text1, string Text2, string Text3, string Text4, string Text5, string Text6, string Text7, int TaxType, int Tax, int SspValue1, int SspValue2, int SspValue3, int SspValue4, int SType)
		{
			rPLURow rPLURow = (rPLURow)NewRow();
			object[] itemArray = new object[64]
			{
				PLUID, Valid, Remark, Index, UnitID, Price, Cost, Tare, BarF1, BarF2,
				BarT1, BarT2, LabelID1, LabelID2, ClassID, PS_SD, PS_ST, PS_PD, PS_PT, PS_UD,
				PC_SD, PC_ST, PC_PD, PC_PT, PC_UD, DF_U, DF_D, DF_UN, DF_DN, DA_Sort1,
				DA_Day1, DA_Up1, DA_Dn1, DA_Num1, DA_Sort2, DA_Day2, DA_Up2, DA_Dn2, DA_Num2, DA_Sort3,
				DA_Day3, DA_Up3, DA_Dn3, DA_Num3, DA_Sort4, DA_Day4, DA_Up4, DA_Dn4, DA_Num4, Name,
				Text1, Text2, Text3, Text4, Text5, Text6, Text7, TaxType, Tax, SspValue1,
				SspValue2, SspValue3, SspValue4, SType
			};
			rPLURow.ItemArray = itemArray;
			base.Rows.Add(rPLURow);
			return rPLURow;
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public rPLURow FindByPLUID(int PLUID)
		{
			return (rPLURow)base.Rows.Find(new object[1] { PLUID });
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
			rPLUDataTable rPLUDataTable = (rPLUDataTable)base.Clone();
			rPLUDataTable.InitVars();
			return rPLUDataTable;
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		protected override DataTable CreateInstance()
		{
			return new rPLUDataTable();
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		internal void InitVars()
		{
			columnPLUID = base.Columns["PLUID"];
			columnValid = base.Columns["Valid"];
			columnRemark = base.Columns["Remark"];
			columnIndex = base.Columns["Index"];
			columnUnitID = base.Columns["UnitID"];
			columnPrice = base.Columns["Price"];
			columnCost = base.Columns["Cost"];
			columnTare = base.Columns["Tare"];
			columnBarF1 = base.Columns["BarF1"];
			columnBarF2 = base.Columns["BarF2"];
			columnBarT1 = base.Columns["BarT1"];
			columnBarT2 = base.Columns["BarT2"];
			columnLabelID1 = base.Columns["LabelID1"];
			columnLabelID2 = base.Columns["LabelID2"];
			columnClassID = base.Columns["ClassID"];
			columnPS_SD = base.Columns["PS_SD"];
			columnPS_ST = base.Columns["PS_ST"];
			columnPS_PD = base.Columns["PS_PD"];
			columnPS_PT = base.Columns["PS_PT"];
			columnPS_UD = base.Columns["PS_UD"];
			columnPC_SD = base.Columns["PC_SD"];
			columnPC_ST = base.Columns["PC_ST"];
			columnPC_PD = base.Columns["PC_PD"];
			columnPC_PT = base.Columns["PC_PT"];
			columnPC_UD = base.Columns["PC_UD"];
			columnDF_U = base.Columns["DF_U"];
			columnDF_D = base.Columns["DF_D"];
			columnDF_UN = base.Columns["DF_UN"];
			columnDF_DN = base.Columns["DF_DN"];
			columnDA_Sort1 = base.Columns["DA_Sort1"];
			columnDA_Day1 = base.Columns["DA_Day1"];
			columnDA_Up1 = base.Columns["DA_Up1"];
			columnDA_Dn1 = base.Columns["DA_Dn1"];
			columnDA_Num1 = base.Columns["DA_Num1"];
			columnDA_Sort2 = base.Columns["DA_Sort2"];
			columnDA_Day2 = base.Columns["DA_Day2"];
			columnDA_Up2 = base.Columns["DA_Up2"];
			columnDA_Dn2 = base.Columns["DA_Dn2"];
			columnDA_Num2 = base.Columns["DA_Num2"];
			columnDA_Sort3 = base.Columns["DA_Sort3"];
			columnDA_Day3 = base.Columns["DA_Day3"];
			columnDA_Up3 = base.Columns["DA_Up3"];
			columnDA_Dn3 = base.Columns["DA_Dn3"];
			columnDA_Num3 = base.Columns["DA_Num3"];
			columnDA_Sort4 = base.Columns["DA_Sort4"];
			columnDA_Day4 = base.Columns["DA_Day4"];
			columnDA_Up4 = base.Columns["DA_Up4"];
			columnDA_Dn4 = base.Columns["DA_Dn4"];
			columnDA_Num4 = base.Columns["DA_Num4"];
			columnName = base.Columns["Name"];
			columnText1 = base.Columns["Text1"];
			columnText2 = base.Columns["Text2"];
			columnText3 = base.Columns["Text3"];
			columnText4 = base.Columns["Text4"];
			columnText5 = base.Columns["Text5"];
			columnText6 = base.Columns["Text6"];
			columnText7 = base.Columns["Text7"];
			columnTaxType = base.Columns["TaxType"];
			columnTax = base.Columns["Tax"];
			columnSspValue1 = base.Columns["SspValue1"];
			columnSspValue2 = base.Columns["SspValue2"];
			columnSspValue3 = base.Columns["SspValue3"];
			columnSspValue4 = base.Columns["SspValue4"];
			columnSType = base.Columns["SType"];
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		private void InitClass()
		{
			columnPLUID = new DataColumn("PLUID", typeof(int), null, MappingType.Element);
			base.Columns.Add(columnPLUID);
			columnValid = new DataColumn("Valid", typeof(bool), null, MappingType.Element);
			base.Columns.Add(columnValid);
			columnRemark = new DataColumn("Remark", typeof(int), null, MappingType.Element);
			base.Columns.Add(columnRemark);
			columnIndex = new DataColumn("Index", typeof(string), null, MappingType.Element);
			base.Columns.Add(columnIndex);
			columnUnitID = new DataColumn("UnitID", typeof(int), null, MappingType.Element);
			base.Columns.Add(columnUnitID);
			columnPrice = new DataColumn("Price", typeof(decimal), null, MappingType.Element);
			base.Columns.Add(columnPrice);
			columnCost = new DataColumn("Cost", typeof(decimal), null, MappingType.Element);
			base.Columns.Add(columnCost);
			columnTare = new DataColumn("Tare", typeof(decimal), null, MappingType.Element);
			base.Columns.Add(columnTare);
			columnBarF1 = new DataColumn("BarF1", typeof(int), null, MappingType.Element);
			base.Columns.Add(columnBarF1);
			columnBarF2 = new DataColumn("BarF2", typeof(int), null, MappingType.Element);
			base.Columns.Add(columnBarF2);
			columnBarT1 = new DataColumn("BarT1", typeof(int), null, MappingType.Element);
			base.Columns.Add(columnBarT1);
			columnBarT2 = new DataColumn("BarT2", typeof(int), null, MappingType.Element);
			base.Columns.Add(columnBarT2);
			columnLabelID1 = new DataColumn("LabelID1", typeof(int), null, MappingType.Element);
			base.Columns.Add(columnLabelID1);
			columnLabelID2 = new DataColumn("LabelID2", typeof(int), null, MappingType.Element);
			base.Columns.Add(columnLabelID2);
			columnClassID = new DataColumn("ClassID", typeof(int), null, MappingType.Element);
			base.Columns.Add(columnClassID);
			columnPS_SD = new DataColumn("PS_SD", typeof(int), null, MappingType.Element);
			base.Columns.Add(columnPS_SD);
			columnPS_ST = new DataColumn("PS_ST", typeof(int), null, MappingType.Element);
			base.Columns.Add(columnPS_ST);
			columnPS_PD = new DataColumn("PS_PD", typeof(int), null, MappingType.Element);
			base.Columns.Add(columnPS_PD);
			columnPS_PT = new DataColumn("PS_PT", typeof(int), null, MappingType.Element);
			base.Columns.Add(columnPS_PT);
			columnPS_UD = new DataColumn("PS_UD", typeof(int), null, MappingType.Element);
			base.Columns.Add(columnPS_UD);
			columnPC_SD = new DataColumn("PC_SD", typeof(int), null, MappingType.Element);
			base.Columns.Add(columnPC_SD);
			columnPC_ST = new DataColumn("PC_ST", typeof(int), null, MappingType.Element);
			base.Columns.Add(columnPC_ST);
			columnPC_PD = new DataColumn("PC_PD", typeof(int), null, MappingType.Element);
			base.Columns.Add(columnPC_PD);
			columnPC_PT = new DataColumn("PC_PT", typeof(int), null, MappingType.Element);
			base.Columns.Add(columnPC_PT);
			columnPC_UD = new DataColumn("PC_UD", typeof(int), null, MappingType.Element);
			base.Columns.Add(columnPC_UD);
			columnDF_U = new DataColumn("DF_U", typeof(int), null, MappingType.Element);
			base.Columns.Add(columnDF_U);
			columnDF_D = new DataColumn("DF_D", typeof(int), null, MappingType.Element);
			base.Columns.Add(columnDF_D);
			columnDF_UN = new DataColumn("DF_UN", typeof(decimal), null, MappingType.Element);
			base.Columns.Add(columnDF_UN);
			columnDF_DN = new DataColumn("DF_DN", typeof(decimal), null, MappingType.Element);
			base.Columns.Add(columnDF_DN);
			columnDA_Sort1 = new DataColumn("DA_Sort1", typeof(int), null, MappingType.Element);
			base.Columns.Add(columnDA_Sort1);
			columnDA_Day1 = new DataColumn("DA_Day1", typeof(int), null, MappingType.Element);
			base.Columns.Add(columnDA_Day1);
			columnDA_Up1 = new DataColumn("DA_Up1", typeof(decimal), null, MappingType.Element);
			base.Columns.Add(columnDA_Up1);
			columnDA_Dn1 = new DataColumn("DA_Dn1", typeof(decimal), null, MappingType.Element);
			base.Columns.Add(columnDA_Dn1);
			columnDA_Num1 = new DataColumn("DA_Num1", typeof(decimal), null, MappingType.Element);
			base.Columns.Add(columnDA_Num1);
			columnDA_Sort2 = new DataColumn("DA_Sort2", typeof(int), null, MappingType.Element);
			base.Columns.Add(columnDA_Sort2);
			columnDA_Day2 = new DataColumn("DA_Day2", typeof(int), null, MappingType.Element);
			base.Columns.Add(columnDA_Day2);
			columnDA_Up2 = new DataColumn("DA_Up2", typeof(decimal), null, MappingType.Element);
			base.Columns.Add(columnDA_Up2);
			columnDA_Dn2 = new DataColumn("DA_Dn2", typeof(decimal), null, MappingType.Element);
			base.Columns.Add(columnDA_Dn2);
			columnDA_Num2 = new DataColumn("DA_Num2", typeof(decimal), null, MappingType.Element);
			base.Columns.Add(columnDA_Num2);
			columnDA_Sort3 = new DataColumn("DA_Sort3", typeof(int), null, MappingType.Element);
			base.Columns.Add(columnDA_Sort3);
			columnDA_Day3 = new DataColumn("DA_Day3", typeof(int), null, MappingType.Element);
			base.Columns.Add(columnDA_Day3);
			columnDA_Up3 = new DataColumn("DA_Up3", typeof(decimal), null, MappingType.Element);
			base.Columns.Add(columnDA_Up3);
			columnDA_Dn3 = new DataColumn("DA_Dn3", typeof(decimal), null, MappingType.Element);
			base.Columns.Add(columnDA_Dn3);
			columnDA_Num3 = new DataColumn("DA_Num3", typeof(decimal), null, MappingType.Element);
			base.Columns.Add(columnDA_Num3);
			columnDA_Sort4 = new DataColumn("DA_Sort4", typeof(int), null, MappingType.Element);
			base.Columns.Add(columnDA_Sort4);
			columnDA_Day4 = new DataColumn("DA_Day4", typeof(int), null, MappingType.Element);
			base.Columns.Add(columnDA_Day4);
			columnDA_Up4 = new DataColumn("DA_Up4", typeof(decimal), null, MappingType.Element);
			base.Columns.Add(columnDA_Up4);
			columnDA_Dn4 = new DataColumn("DA_Dn4", typeof(decimal), null, MappingType.Element);
			base.Columns.Add(columnDA_Dn4);
			columnDA_Num4 = new DataColumn("DA_Num4", typeof(decimal), null, MappingType.Element);
			base.Columns.Add(columnDA_Num4);
			columnName = new DataColumn("Name", typeof(string), null, MappingType.Element);
			base.Columns.Add(columnName);
			columnText1 = new DataColumn("Text1", typeof(string), null, MappingType.Element);
			base.Columns.Add(columnText1);
			columnText2 = new DataColumn("Text2", typeof(string), null, MappingType.Element);
			base.Columns.Add(columnText2);
			columnText3 = new DataColumn("Text3", typeof(string), null, MappingType.Element);
			base.Columns.Add(columnText3);
			columnText4 = new DataColumn("Text4", typeof(string), null, MappingType.Element);
			base.Columns.Add(columnText4);
			columnText5 = new DataColumn("Text5", typeof(string), null, MappingType.Element);
			base.Columns.Add(columnText5);
			columnText6 = new DataColumn("Text6", typeof(string), null, MappingType.Element);
			base.Columns.Add(columnText6);
			columnText7 = new DataColumn("Text7", typeof(string), null, MappingType.Element);
			base.Columns.Add(columnText7);
			columnTaxType = new DataColumn("TaxType", typeof(int), null, MappingType.Element);
			base.Columns.Add(columnTaxType);
			columnTax = new DataColumn("Tax", typeof(int), null, MappingType.Element);
			base.Columns.Add(columnTax);
			columnSspValue1 = new DataColumn("SspValue1", typeof(int), null, MappingType.Element);
			base.Columns.Add(columnSspValue1);
			columnSspValue2 = new DataColumn("SspValue2", typeof(int), null, MappingType.Element);
			base.Columns.Add(columnSspValue2);
			columnSspValue3 = new DataColumn("SspValue3", typeof(int), null, MappingType.Element);
			base.Columns.Add(columnSspValue3);
			columnSspValue4 = new DataColumn("SspValue4", typeof(int), null, MappingType.Element);
			base.Columns.Add(columnSspValue4);
			columnSType = new DataColumn("SType", typeof(int), null, MappingType.Element);
			base.Columns.Add(columnSType);
			base.Constraints.Add(new UniqueConstraint("Constraint1", new DataColumn[1] { columnPLUID }, isPrimaryKey: true));
			columnPLUID.AllowDBNull = false;
			columnPLUID.Unique = true;
			columnIndex.MaxLength = 255;
			columnName.MaxLength = 255;
			columnText1.MaxLength = 255;
			columnText2.MaxLength = 255;
			columnText3.MaxLength = 255;
			columnText4.MaxLength = 255;
			columnText5.MaxLength = 255;
			columnText6.MaxLength = 255;
			columnText7.MaxLength = 255;
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public rPLURow NewrPLURow()
		{
			return (rPLURow)NewRow();
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		protected override DataRow NewRowFromBuilder(DataRowBuilder builder)
		{
			return new rPLURow(builder);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		protected override Type GetRowType()
		{
			return typeof(rPLURow);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		protected override void OnRowChanged(DataRowChangeEventArgs e)
		{
			base.OnRowChanged(e);
			if (this.rPLURowChanged != null)
			{
				this.rPLURowChanged(this, new rPLURowChangeEvent((rPLURow)e.Row, e.Action));
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		protected override void OnRowChanging(DataRowChangeEventArgs e)
		{
			base.OnRowChanging(e);
			if (this.rPLURowChanging != null)
			{
				this.rPLURowChanging(this, new rPLURowChangeEvent((rPLURow)e.Row, e.Action));
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		protected override void OnRowDeleted(DataRowChangeEventArgs e)
		{
			base.OnRowDeleted(e);
			if (this.rPLURowDeleted != null)
			{
				this.rPLURowDeleted(this, new rPLURowChangeEvent((rPLURow)e.Row, e.Action));
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		protected override void OnRowDeleting(DataRowChangeEventArgs e)
		{
			base.OnRowDeleting(e);
			if (this.rPLURowDeleting != null)
			{
				this.rPLURowDeleting(this, new rPLURowChangeEvent((rPLURow)e.Row, e.Action));
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public void RemoverPLURow(rPLURow row)
		{
			base.Rows.Remove(row);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public static XmlSchemaComplexType GetTypedTableSchema(XmlSchemaSet xs)
		{
			XmlSchemaComplexType xmlSchemaComplexType = new XmlSchemaComplexType();
			XmlSchemaSequence xmlSchemaSequence = new XmlSchemaSequence();
			ReportDataSet reportDataSet = new ReportDataSet();
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
			xmlSchemaAttribute.FixedValue = reportDataSet.Namespace;
			xmlSchemaComplexType.Attributes.Add(xmlSchemaAttribute);
			XmlSchemaAttribute xmlSchemaAttribute2 = new XmlSchemaAttribute();
			xmlSchemaAttribute2.Name = "tableTypeName";
			xmlSchemaAttribute2.FixedValue = "rPLUDataTable";
			xmlSchemaComplexType.Attributes.Add(xmlSchemaAttribute2);
			xmlSchemaComplexType.Particle = xmlSchemaSequence;
			XmlSchema schemaSerializable = reportDataSet.GetSchemaSerializable();
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
	public class rUnitDataTable : DataTable, IEnumerable
	{
		private DataColumn columnUnitID;

		private DataColumn columnAmount;

		private DataColumn columnPamount;

		private DataColumn columnName;

		private DataColumn columnPunit;

		private DataColumn columnPack;

		private DataColumn columnFlagP;

		private DataColumn columnFlagA;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public DataColumn UnitIDColumn => columnUnitID;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public DataColumn AmountColumn => columnAmount;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public DataColumn PamountColumn => columnPamount;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public DataColumn NameColumn => columnName;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public DataColumn PunitColumn => columnPunit;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public DataColumn PackColumn => columnPack;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public DataColumn FlagPColumn => columnFlagP;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public DataColumn FlagAColumn => columnFlagA;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[Browsable(false)]
		[DebuggerNonUserCode]
		public int Count => base.Rows.Count;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public rUnitRow this[int index] => (rUnitRow)base.Rows[index];

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public event rUnitRowChangeEventHandler rUnitRowChanging;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public event rUnitRowChangeEventHandler rUnitRowChanged;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public event rUnitRowChangeEventHandler rUnitRowDeleting;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public event rUnitRowChangeEventHandler rUnitRowDeleted;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public rUnitDataTable()
		{
			base.TableName = "rUnit";
			BeginInit();
			InitClass();
			EndInit();
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		internal rUnitDataTable(DataTable table)
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
		protected rUnitDataTable(SerializationInfo info, StreamingContext context)
			: base(info, context)
		{
			InitVars();
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public void AddrUnitRow(rUnitRow row)
		{
			base.Rows.Add(row);
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public rUnitRow AddrUnitRow(int UnitID, string Amount, string Pamount, string Name, int Punit, decimal Pack, bool FlagP, bool FlagA)
		{
			rUnitRow rUnitRow = (rUnitRow)NewRow();
			object[] itemArray = new object[8] { UnitID, Amount, Pamount, Name, Punit, Pack, FlagP, FlagA };
			rUnitRow.ItemArray = itemArray;
			base.Rows.Add(rUnitRow);
			return rUnitRow;
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public rUnitRow FindByUnitID(int UnitID)
		{
			return (rUnitRow)base.Rows.Find(new object[1] { UnitID });
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
			rUnitDataTable rUnitDataTable = (rUnitDataTable)base.Clone();
			rUnitDataTable.InitVars();
			return rUnitDataTable;
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		protected override DataTable CreateInstance()
		{
			return new rUnitDataTable();
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		internal void InitVars()
		{
			columnUnitID = base.Columns["UnitID"];
			columnAmount = base.Columns["Amount"];
			columnPamount = base.Columns["Pamount"];
			columnName = base.Columns["Name"];
			columnPunit = base.Columns["Punit"];
			columnPack = base.Columns["Pack"];
			columnFlagP = base.Columns["FlagP"];
			columnFlagA = base.Columns["FlagA"];
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		private void InitClass()
		{
			columnUnitID = new DataColumn("UnitID", typeof(int), null, MappingType.Element);
			base.Columns.Add(columnUnitID);
			columnAmount = new DataColumn("Amount", typeof(string), null, MappingType.Element);
			base.Columns.Add(columnAmount);
			columnPamount = new DataColumn("Pamount", typeof(string), null, MappingType.Element);
			base.Columns.Add(columnPamount);
			columnName = new DataColumn("Name", typeof(string), null, MappingType.Element);
			base.Columns.Add(columnName);
			columnPunit = new DataColumn("Punit", typeof(int), null, MappingType.Element);
			base.Columns.Add(columnPunit);
			columnPack = new DataColumn("Pack", typeof(decimal), null, MappingType.Element);
			base.Columns.Add(columnPack);
			columnFlagP = new DataColumn("FlagP", typeof(bool), null, MappingType.Element);
			base.Columns.Add(columnFlagP);
			columnFlagA = new DataColumn("FlagA", typeof(bool), null, MappingType.Element);
			base.Columns.Add(columnFlagA);
			base.Constraints.Add(new UniqueConstraint("Constraint1", new DataColumn[1] { columnUnitID }, isPrimaryKey: true));
			columnUnitID.AllowDBNull = false;
			columnUnitID.Unique = true;
			columnAmount.MaxLength = 255;
			columnPamount.MaxLength = 255;
			columnName.MaxLength = 255;
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public rUnitRow NewrUnitRow()
		{
			return (rUnitRow)NewRow();
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		protected override DataRow NewRowFromBuilder(DataRowBuilder builder)
		{
			return new rUnitRow(builder);
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		protected override Type GetRowType()
		{
			return typeof(rUnitRow);
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		protected override void OnRowChanged(DataRowChangeEventArgs e)
		{
			base.OnRowChanged(e);
			if (this.rUnitRowChanged != null)
			{
				this.rUnitRowChanged(this, new rUnitRowChangeEvent((rUnitRow)e.Row, e.Action));
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		protected override void OnRowChanging(DataRowChangeEventArgs e)
		{
			base.OnRowChanging(e);
			if (this.rUnitRowChanging != null)
			{
				this.rUnitRowChanging(this, new rUnitRowChangeEvent((rUnitRow)e.Row, e.Action));
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		protected override void OnRowDeleted(DataRowChangeEventArgs e)
		{
			base.OnRowDeleted(e);
			if (this.rUnitRowDeleted != null)
			{
				this.rUnitRowDeleted(this, new rUnitRowChangeEvent((rUnitRow)e.Row, e.Action));
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		protected override void OnRowDeleting(DataRowChangeEventArgs e)
		{
			base.OnRowDeleting(e);
			if (this.rUnitRowDeleting != null)
			{
				this.rUnitRowDeleting(this, new rUnitRowChangeEvent((rUnitRow)e.Row, e.Action));
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public void RemoverUnitRow(rUnitRow row)
		{
			base.Rows.Remove(row);
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public static XmlSchemaComplexType GetTypedTableSchema(XmlSchemaSet xs)
		{
			XmlSchemaComplexType xmlSchemaComplexType = new XmlSchemaComplexType();
			XmlSchemaSequence xmlSchemaSequence = new XmlSchemaSequence();
			ReportDataSet reportDataSet = new ReportDataSet();
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
			xmlSchemaAttribute.FixedValue = reportDataSet.Namespace;
			xmlSchemaComplexType.Attributes.Add(xmlSchemaAttribute);
			XmlSchemaAttribute xmlSchemaAttribute2 = new XmlSchemaAttribute();
			xmlSchemaAttribute2.Name = "tableTypeName";
			xmlSchemaAttribute2.FixedValue = "rUnitDataTable";
			xmlSchemaComplexType.Attributes.Add(xmlSchemaAttribute2);
			xmlSchemaComplexType.Particle = xmlSchemaSequence;
			XmlSchema schemaSerializable = reportDataSet.GetSchemaSerializable();
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
	public class AllLogsDataTable : DataTable, IEnumerable
	{
		private DataColumn columnMAC;

		private DataColumn columnName;

		private DataColumn columnFID;

		private DataColumn columnDateTime;

		private DataColumn columnSID;

		private DataColumn columnSalesman;

		private DataColumn columnSubID;

		private DataColumn columnPrice;

		private DataColumn columnPLU;

		private DataColumn columnClass;

		private DataColumn columnDept;

		private DataColumn columnCost;

		private DataColumn columnUnit;

		private DataColumn columnType;

		private DataColumn columnTax;

		private DataColumn columnAmount;

		private DataColumn columnText1;

		private DataColumn columnText2;

		private DataColumn columnText3;

		private DataColumn columnText4;

		private DataColumn columnUnitPrice;

		private DataColumn columnCoFID;

		private DataColumn columnPLUName;

		private DataColumn columnTypeName;

		private DataColumn columnUnitName;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public DataColumn MACColumn => columnMAC;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public DataColumn NameColumn => columnName;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public DataColumn FIDColumn => columnFID;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public DataColumn DateTimeColumn => columnDateTime;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public DataColumn SIDColumn => columnSID;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public DataColumn SalesmanColumn => columnSalesman;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public DataColumn SubIDColumn => columnSubID;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public DataColumn PriceColumn => columnPrice;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public DataColumn PLUColumn => columnPLU;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public DataColumn ClassColumn => columnClass;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public DataColumn DeptColumn => columnDept;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public DataColumn CostColumn => columnCost;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public DataColumn UnitColumn => columnUnit;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public DataColumn TypeColumn => columnType;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public DataColumn TaxColumn => columnTax;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public DataColumn AmountColumn => columnAmount;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public DataColumn Text1Column => columnText1;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public DataColumn Text2Column => columnText2;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public DataColumn Text3Column => columnText3;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public DataColumn Text4Column => columnText4;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public DataColumn UnitPriceColumn => columnUnitPrice;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public DataColumn CoFIDColumn => columnCoFID;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public DataColumn PLUNameColumn => columnPLUName;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public DataColumn TypeNameColumn => columnTypeName;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public DataColumn UnitNameColumn => columnUnitName;

		[Browsable(false)]
		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public int Count => base.Rows.Count;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public AllLogsRow this[int index] => (AllLogsRow)base.Rows[index];

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public event AllLogsRowChangeEventHandler AllLogsRowChanging;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public event AllLogsRowChangeEventHandler AllLogsRowChanged;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public event AllLogsRowChangeEventHandler AllLogsRowDeleting;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public event AllLogsRowChangeEventHandler AllLogsRowDeleted;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public AllLogsDataTable()
		{
			base.TableName = "AllLogs";
			BeginInit();
			InitClass();
			EndInit();
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		internal AllLogsDataTable(DataTable table)
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
		protected AllLogsDataTable(SerializationInfo info, StreamingContext context)
			: base(info, context)
		{
			InitVars();
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public void AddAllLogsRow(AllLogsRow row)
		{
			base.Rows.Add(row);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public AllLogsRow AddAllLogsRow(string MAC, string Name, int FID, DateTime DateTime, int SID, int Salesman, int SubID, decimal Price, int PLU, int Class, int Dept, decimal Cost, int Unit, int Type, decimal Tax, decimal Amount, string Text1, string Text2, string Text3, string Text4, decimal UnitPrice, int CoFID, string PLUName, string TypeName, string UnitName)
		{
			AllLogsRow allLogsRow = (AllLogsRow)NewRow();
			object[] itemArray = new object[25]
			{
				MAC, Name, FID, DateTime, SID, Salesman, SubID, Price, PLU, Class,
				Dept, Cost, Unit, Type, Tax, Amount, Text1, Text2, Text3, Text4,
				UnitPrice, CoFID, PLUName, TypeName, UnitName
			};
			allLogsRow.ItemArray = itemArray;
			base.Rows.Add(allLogsRow);
			return allLogsRow;
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
			AllLogsDataTable allLogsDataTable = (AllLogsDataTable)base.Clone();
			allLogsDataTable.InitVars();
			return allLogsDataTable;
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		protected override DataTable CreateInstance()
		{
			return new AllLogsDataTable();
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		internal void InitVars()
		{
			columnMAC = base.Columns["MAC"];
			columnName = base.Columns["Name"];
			columnFID = base.Columns["FID"];
			columnDateTime = base.Columns["DateTime"];
			columnSID = base.Columns["SID"];
			columnSalesman = base.Columns["Salesman"];
			columnSubID = base.Columns["SubID"];
			columnPrice = base.Columns["Price"];
			columnPLU = base.Columns["PLU"];
			columnClass = base.Columns["Class"];
			columnDept = base.Columns["Dept"];
			columnCost = base.Columns["Cost"];
			columnUnit = base.Columns["Unit"];
			columnType = base.Columns["Type"];
			columnTax = base.Columns["Tax"];
			columnAmount = base.Columns["Amount"];
			columnText1 = base.Columns["Text1"];
			columnText2 = base.Columns["Text2"];
			columnText3 = base.Columns["Text3"];
			columnText4 = base.Columns["Text4"];
			columnUnitPrice = base.Columns["UnitPrice"];
			columnCoFID = base.Columns["CoFID"];
			columnPLUName = base.Columns["PLUName"];
			columnTypeName = base.Columns["TypeName"];
			columnUnitName = base.Columns["UnitName"];
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		private void InitClass()
		{
			columnMAC = new DataColumn("MAC", typeof(string), null, MappingType.Element);
			base.Columns.Add(columnMAC);
			columnName = new DataColumn("Name", typeof(string), null, MappingType.Element);
			base.Columns.Add(columnName);
			columnFID = new DataColumn("FID", typeof(int), null, MappingType.Element);
			base.Columns.Add(columnFID);
			columnDateTime = new DataColumn("DateTime", typeof(DateTime), null, MappingType.Element);
			base.Columns.Add(columnDateTime);
			columnSID = new DataColumn("SID", typeof(int), null, MappingType.Element);
			base.Columns.Add(columnSID);
			columnSalesman = new DataColumn("Salesman", typeof(int), null, MappingType.Element);
			base.Columns.Add(columnSalesman);
			columnSubID = new DataColumn("SubID", typeof(int), null, MappingType.Element);
			base.Columns.Add(columnSubID);
			columnPrice = new DataColumn("Price", typeof(decimal), null, MappingType.Element);
			base.Columns.Add(columnPrice);
			columnPLU = new DataColumn("PLU", typeof(int), null, MappingType.Element);
			base.Columns.Add(columnPLU);
			columnClass = new DataColumn("Class", typeof(int), null, MappingType.Element);
			base.Columns.Add(columnClass);
			columnDept = new DataColumn("Dept", typeof(int), null, MappingType.Element);
			base.Columns.Add(columnDept);
			columnCost = new DataColumn("Cost", typeof(decimal), null, MappingType.Element);
			base.Columns.Add(columnCost);
			columnUnit = new DataColumn("Unit", typeof(int), null, MappingType.Element);
			base.Columns.Add(columnUnit);
			columnType = new DataColumn("Type", typeof(int), null, MappingType.Element);
			base.Columns.Add(columnType);
			columnTax = new DataColumn("Tax", typeof(decimal), null, MappingType.Element);
			base.Columns.Add(columnTax);
			columnAmount = new DataColumn("Amount", typeof(decimal), null, MappingType.Element);
			base.Columns.Add(columnAmount);
			columnText1 = new DataColumn("Text1", typeof(string), null, MappingType.Element);
			base.Columns.Add(columnText1);
			columnText2 = new DataColumn("Text2", typeof(string), null, MappingType.Element);
			base.Columns.Add(columnText2);
			columnText3 = new DataColumn("Text3", typeof(string), null, MappingType.Element);
			base.Columns.Add(columnText3);
			columnText4 = new DataColumn("Text4", typeof(string), null, MappingType.Element);
			base.Columns.Add(columnText4);
			columnUnitPrice = new DataColumn("UnitPrice", typeof(decimal), null, MappingType.Element);
			base.Columns.Add(columnUnitPrice);
			columnCoFID = new DataColumn("CoFID", typeof(int), null, MappingType.Element);
			base.Columns.Add(columnCoFID);
			columnPLUName = new DataColumn("PLUName", typeof(string), null, MappingType.Element);
			base.Columns.Add(columnPLUName);
			columnTypeName = new DataColumn("TypeName", typeof(string), null, MappingType.Element);
			base.Columns.Add(columnTypeName);
			columnUnitName = new DataColumn("UnitName", typeof(string), null, MappingType.Element);
			base.Columns.Add(columnUnitName);
			columnMAC.MaxLength = 255;
			columnName.MaxLength = 255;
			columnAmount.DefaultValue = 0m;
			columnText1.MaxLength = 255;
			columnText2.MaxLength = 255;
			columnText3.MaxLength = 255;
			columnText4.MaxLength = 255;
			columnPLUName.DefaultValue = "";
			columnPLUName.MaxLength = 255;
			columnTypeName.MaxLength = 255;
			columnUnitName.MaxLength = 255;
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public AllLogsRow NewAllLogsRow()
		{
			return (AllLogsRow)NewRow();
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		protected override DataRow NewRowFromBuilder(DataRowBuilder builder)
		{
			return new AllLogsRow(builder);
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		protected override Type GetRowType()
		{
			return typeof(AllLogsRow);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		protected override void OnRowChanged(DataRowChangeEventArgs e)
		{
			base.OnRowChanged(e);
			if (this.AllLogsRowChanged != null)
			{
				this.AllLogsRowChanged(this, new AllLogsRowChangeEvent((AllLogsRow)e.Row, e.Action));
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		protected override void OnRowChanging(DataRowChangeEventArgs e)
		{
			base.OnRowChanging(e);
			if (this.AllLogsRowChanging != null)
			{
				this.AllLogsRowChanging(this, new AllLogsRowChangeEvent((AllLogsRow)e.Row, e.Action));
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		protected override void OnRowDeleted(DataRowChangeEventArgs e)
		{
			base.OnRowDeleted(e);
			if (this.AllLogsRowDeleted != null)
			{
				this.AllLogsRowDeleted(this, new AllLogsRowChangeEvent((AllLogsRow)e.Row, e.Action));
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		protected override void OnRowDeleting(DataRowChangeEventArgs e)
		{
			base.OnRowDeleting(e);
			if (this.AllLogsRowDeleting != null)
			{
				this.AllLogsRowDeleting(this, new AllLogsRowChangeEvent((AllLogsRow)e.Row, e.Action));
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public void RemoveAllLogsRow(AllLogsRow row)
		{
			base.Rows.Remove(row);
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public static XmlSchemaComplexType GetTypedTableSchema(XmlSchemaSet xs)
		{
			XmlSchemaComplexType xmlSchemaComplexType = new XmlSchemaComplexType();
			XmlSchemaSequence xmlSchemaSequence = new XmlSchemaSequence();
			ReportDataSet reportDataSet = new ReportDataSet();
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
			xmlSchemaAttribute.FixedValue = reportDataSet.Namespace;
			xmlSchemaComplexType.Attributes.Add(xmlSchemaAttribute);
			XmlSchemaAttribute xmlSchemaAttribute2 = new XmlSchemaAttribute();
			xmlSchemaAttribute2.Name = "tableTypeName";
			xmlSchemaAttribute2.FixedValue = "AllLogsDataTable";
			xmlSchemaComplexType.Attributes.Add(xmlSchemaAttribute2);
			xmlSchemaComplexType.Particle = xmlSchemaSequence;
			XmlSchema schemaSerializable = reportDataSet.GetSchemaSerializable();
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
	public class AllStocksDataTable : DataTable, IEnumerable
	{
		private DataColumn columnKID;

		private DataColumn columnName;

		private DataColumn columnPLU;

		private DataColumn columnPLUName;

		private DataColumn columnUnit;

		private DataColumn columnAmount;

		private DataColumn columnSTakingTime;

		private DataColumn columnSpoilage;

		private DataColumn columnIn_Amount;

		private DataColumn columnGID;

		private DataColumn columnIn_Money;

		private DataColumn columnSafetyStock;

		private DataColumn columnLowStock;

		private DataColumn columnOrder;

		private DataColumn columnUnitName;

		private DataColumn columnKID_Time;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public DataColumn KIDColumn => columnKID;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public DataColumn NameColumn => columnName;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public DataColumn PLUColumn => columnPLU;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public DataColumn PLUNameColumn => columnPLUName;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public DataColumn UnitColumn => columnUnit;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public DataColumn AmountColumn => columnAmount;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public DataColumn STakingTimeColumn => columnSTakingTime;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public DataColumn SpoilageColumn => columnSpoilage;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public DataColumn In_AmountColumn => columnIn_Amount;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public DataColumn GIDColumn => columnGID;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public DataColumn In_MoneyColumn => columnIn_Money;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public DataColumn SafetyStockColumn => columnSafetyStock;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public DataColumn LowStockColumn => columnLowStock;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public DataColumn OrderColumn => columnOrder;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public DataColumn UnitNameColumn => columnUnitName;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public DataColumn KID_TimeColumn => columnKID_Time;

		[Browsable(false)]
		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public int Count => base.Rows.Count;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public AllStocksRow this[int index] => (AllStocksRow)base.Rows[index];

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public event AllStocksRowChangeEventHandler AllStocksRowChanging;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public event AllStocksRowChangeEventHandler AllStocksRowChanged;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public event AllStocksRowChangeEventHandler AllStocksRowDeleting;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public event AllStocksRowChangeEventHandler AllStocksRowDeleted;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public AllStocksDataTable()
		{
			base.TableName = "AllStocks";
			BeginInit();
			InitClass();
			EndInit();
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		internal AllStocksDataTable(DataTable table)
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
		protected AllStocksDataTable(SerializationInfo info, StreamingContext context)
			: base(info, context)
		{
			InitVars();
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public void AddAllStocksRow(AllStocksRow row)
		{
			base.Rows.Add(row);
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public AllStocksRow AddAllStocksRow(int KID, string Name, int PLU, string PLUName, int Unit, decimal Amount, DateTime STakingTime, decimal Spoilage, decimal In_Amount, int GID, decimal In_Money, decimal SafetyStock, bool LowStock, decimal Order, string UnitName, DateTime KID_Time)
		{
			AllStocksRow allStocksRow = (AllStocksRow)NewRow();
			object[] itemArray = new object[16]
			{
				KID, Name, PLU, PLUName, Unit, Amount, STakingTime, Spoilage, In_Amount, GID,
				In_Money, SafetyStock, LowStock, Order, UnitName, KID_Time
			};
			allStocksRow.ItemArray = itemArray;
			base.Rows.Add(allStocksRow);
			return allStocksRow;
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
			AllStocksDataTable allStocksDataTable = (AllStocksDataTable)base.Clone();
			allStocksDataTable.InitVars();
			return allStocksDataTable;
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		protected override DataTable CreateInstance()
		{
			return new AllStocksDataTable();
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		internal void InitVars()
		{
			columnKID = base.Columns["KID"];
			columnName = base.Columns["Name"];
			columnPLU = base.Columns["PLU"];
			columnPLUName = base.Columns["PLUName"];
			columnUnit = base.Columns["Unit"];
			columnAmount = base.Columns["Amount"];
			columnSTakingTime = base.Columns["STakingTime"];
			columnSpoilage = base.Columns["Spoilage"];
			columnIn_Amount = base.Columns["In_Amount"];
			columnGID = base.Columns["GID"];
			columnIn_Money = base.Columns["In_Money"];
			columnSafetyStock = base.Columns["SafetyStock"];
			columnLowStock = base.Columns["LowStock"];
			columnOrder = base.Columns["Order"];
			columnUnitName = base.Columns["UnitName"];
			columnKID_Time = base.Columns["KID_Time"];
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		private void InitClass()
		{
			columnKID = new DataColumn("KID", typeof(int), null, MappingType.Element);
			base.Columns.Add(columnKID);
			columnName = new DataColumn("Name", typeof(string), null, MappingType.Element);
			base.Columns.Add(columnName);
			columnPLU = new DataColumn("PLU", typeof(int), null, MappingType.Element);
			base.Columns.Add(columnPLU);
			columnPLUName = new DataColumn("PLUName", typeof(string), null, MappingType.Element);
			base.Columns.Add(columnPLUName);
			columnUnit = new DataColumn("Unit", typeof(int), null, MappingType.Element);
			base.Columns.Add(columnUnit);
			columnAmount = new DataColumn("Amount", typeof(decimal), null, MappingType.Element);
			base.Columns.Add(columnAmount);
			columnSTakingTime = new DataColumn("STakingTime", typeof(DateTime), null, MappingType.Element);
			base.Columns.Add(columnSTakingTime);
			columnSpoilage = new DataColumn("Spoilage", typeof(decimal), null, MappingType.Element);
			base.Columns.Add(columnSpoilage);
			columnIn_Amount = new DataColumn("In_Amount", typeof(decimal), null, MappingType.Element);
			base.Columns.Add(columnIn_Amount);
			columnGID = new DataColumn("GID", typeof(int), null, MappingType.Element);
			base.Columns.Add(columnGID);
			columnIn_Money = new DataColumn("In_Money", typeof(decimal), null, MappingType.Element);
			base.Columns.Add(columnIn_Money);
			columnSafetyStock = new DataColumn("SafetyStock", typeof(decimal), null, MappingType.Element);
			base.Columns.Add(columnSafetyStock);
			columnLowStock = new DataColumn("LowStock", typeof(bool), null, MappingType.Element);
			base.Columns.Add(columnLowStock);
			columnOrder = new DataColumn("Order", typeof(decimal), null, MappingType.Element);
			base.Columns.Add(columnOrder);
			columnUnitName = new DataColumn("UnitName", typeof(string), null, MappingType.Element);
			base.Columns.Add(columnUnitName);
			columnKID_Time = new DataColumn("KID_Time", typeof(DateTime), null, MappingType.Element);
			base.Columns.Add(columnKID_Time);
			columnName.MaxLength = 255;
			columnPLUName.MaxLength = 255;
			columnUnitName.MaxLength = 255;
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public AllStocksRow NewAllStocksRow()
		{
			return (AllStocksRow)NewRow();
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		protected override DataRow NewRowFromBuilder(DataRowBuilder builder)
		{
			return new AllStocksRow(builder);
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		protected override Type GetRowType()
		{
			return typeof(AllStocksRow);
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		protected override void OnRowChanged(DataRowChangeEventArgs e)
		{
			base.OnRowChanged(e);
			if (this.AllStocksRowChanged != null)
			{
				this.AllStocksRowChanged(this, new AllStocksRowChangeEvent((AllStocksRow)e.Row, e.Action));
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		protected override void OnRowChanging(DataRowChangeEventArgs e)
		{
			base.OnRowChanging(e);
			if (this.AllStocksRowChanging != null)
			{
				this.AllStocksRowChanging(this, new AllStocksRowChangeEvent((AllStocksRow)e.Row, e.Action));
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		protected override void OnRowDeleted(DataRowChangeEventArgs e)
		{
			base.OnRowDeleted(e);
			if (this.AllStocksRowDeleted != null)
			{
				this.AllStocksRowDeleted(this, new AllStocksRowChangeEvent((AllStocksRow)e.Row, e.Action));
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		protected override void OnRowDeleting(DataRowChangeEventArgs e)
		{
			base.OnRowDeleting(e);
			if (this.AllStocksRowDeleting != null)
			{
				this.AllStocksRowDeleting(this, new AllStocksRowChangeEvent((AllStocksRow)e.Row, e.Action));
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public void RemoveAllStocksRow(AllStocksRow row)
		{
			base.Rows.Remove(row);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public static XmlSchemaComplexType GetTypedTableSchema(XmlSchemaSet xs)
		{
			XmlSchemaComplexType xmlSchemaComplexType = new XmlSchemaComplexType();
			XmlSchemaSequence xmlSchemaSequence = new XmlSchemaSequence();
			ReportDataSet reportDataSet = new ReportDataSet();
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
			xmlSchemaAttribute.FixedValue = reportDataSet.Namespace;
			xmlSchemaComplexType.Attributes.Add(xmlSchemaAttribute);
			XmlSchemaAttribute xmlSchemaAttribute2 = new XmlSchemaAttribute();
			xmlSchemaAttribute2.Name = "tableTypeName";
			xmlSchemaAttribute2.FixedValue = "AllStocksDataTable";
			xmlSchemaComplexType.Attributes.Add(xmlSchemaAttribute2);
			xmlSchemaComplexType.Particle = xmlSchemaSequence;
			XmlSchema schemaSerializable = reportDataSet.GetSchemaSerializable();
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
	public class rLogsTypeDataTable : DataTable, IEnumerable
	{
		private DataColumn columnTypeID;

		private DataColumn columnName;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public DataColumn TypeIDColumn => columnTypeID;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public DataColumn NameColumn => columnName;

		[Browsable(false)]
		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public int Count => base.Rows.Count;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public rLogsTypeRow this[int index] => (rLogsTypeRow)base.Rows[index];

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public event rLogsTypeRowChangeEventHandler rLogsTypeRowChanging;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public event rLogsTypeRowChangeEventHandler rLogsTypeRowChanged;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public event rLogsTypeRowChangeEventHandler rLogsTypeRowDeleting;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public event rLogsTypeRowChangeEventHandler rLogsTypeRowDeleted;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public rLogsTypeDataTable()
		{
			base.TableName = "rLogsType";
			BeginInit();
			InitClass();
			EndInit();
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		internal rLogsTypeDataTable(DataTable table)
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
		protected rLogsTypeDataTable(SerializationInfo info, StreamingContext context)
			: base(info, context)
		{
			InitVars();
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public void AddrLogsTypeRow(rLogsTypeRow row)
		{
			base.Rows.Add(row);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public rLogsTypeRow AddrLogsTypeRow(int TypeID, string Name)
		{
			rLogsTypeRow rLogsTypeRow = (rLogsTypeRow)NewRow();
			object[] itemArray = new object[2] { TypeID, Name };
			rLogsTypeRow.ItemArray = itemArray;
			base.Rows.Add(rLogsTypeRow);
			return rLogsTypeRow;
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public rLogsTypeRow FindByTypeID(int TypeID)
		{
			return (rLogsTypeRow)base.Rows.Find(new object[1] { TypeID });
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
			rLogsTypeDataTable rLogsTypeDataTable = (rLogsTypeDataTable)base.Clone();
			rLogsTypeDataTable.InitVars();
			return rLogsTypeDataTable;
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		protected override DataTable CreateInstance()
		{
			return new rLogsTypeDataTable();
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		internal void InitVars()
		{
			columnTypeID = base.Columns["TypeID"];
			columnName = base.Columns["Name"];
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		private void InitClass()
		{
			columnTypeID = new DataColumn("TypeID", typeof(int), null, MappingType.Element);
			base.Columns.Add(columnTypeID);
			columnName = new DataColumn("Name", typeof(string), null, MappingType.Element);
			base.Columns.Add(columnName);
			base.Constraints.Add(new UniqueConstraint("Constraint1", new DataColumn[1] { columnTypeID }, isPrimaryKey: true));
			columnTypeID.AllowDBNull = false;
			columnTypeID.Unique = true;
			columnName.MaxLength = 255;
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public rLogsTypeRow NewrLogsTypeRow()
		{
			return (rLogsTypeRow)NewRow();
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		protected override DataRow NewRowFromBuilder(DataRowBuilder builder)
		{
			return new rLogsTypeRow(builder);
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		protected override Type GetRowType()
		{
			return typeof(rLogsTypeRow);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		protected override void OnRowChanged(DataRowChangeEventArgs e)
		{
			base.OnRowChanged(e);
			if (this.rLogsTypeRowChanged != null)
			{
				this.rLogsTypeRowChanged(this, new rLogsTypeRowChangeEvent((rLogsTypeRow)e.Row, e.Action));
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		protected override void OnRowChanging(DataRowChangeEventArgs e)
		{
			base.OnRowChanging(e);
			if (this.rLogsTypeRowChanging != null)
			{
				this.rLogsTypeRowChanging(this, new rLogsTypeRowChangeEvent((rLogsTypeRow)e.Row, e.Action));
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		protected override void OnRowDeleted(DataRowChangeEventArgs e)
		{
			base.OnRowDeleted(e);
			if (this.rLogsTypeRowDeleted != null)
			{
				this.rLogsTypeRowDeleted(this, new rLogsTypeRowChangeEvent((rLogsTypeRow)e.Row, e.Action));
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		protected override void OnRowDeleting(DataRowChangeEventArgs e)
		{
			base.OnRowDeleting(e);
			if (this.rLogsTypeRowDeleting != null)
			{
				this.rLogsTypeRowDeleting(this, new rLogsTypeRowChangeEvent((rLogsTypeRow)e.Row, e.Action));
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public void RemoverLogsTypeRow(rLogsTypeRow row)
		{
			base.Rows.Remove(row);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public static XmlSchemaComplexType GetTypedTableSchema(XmlSchemaSet xs)
		{
			XmlSchemaComplexType xmlSchemaComplexType = new XmlSchemaComplexType();
			XmlSchemaSequence xmlSchemaSequence = new XmlSchemaSequence();
			ReportDataSet reportDataSet = new ReportDataSet();
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
			xmlSchemaAttribute.FixedValue = reportDataSet.Namespace;
			xmlSchemaComplexType.Attributes.Add(xmlSchemaAttribute);
			XmlSchemaAttribute xmlSchemaAttribute2 = new XmlSchemaAttribute();
			xmlSchemaAttribute2.Name = "tableTypeName";
			xmlSchemaAttribute2.FixedValue = "rLogsTypeDataTable";
			xmlSchemaComplexType.Attributes.Add(xmlSchemaAttribute2);
			xmlSchemaComplexType.Particle = xmlSchemaSequence;
			XmlSchema schemaSerializable = reportDataSet.GetSchemaSerializable();
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
	public class rStockTypeDataTable : DataTable, IEnumerable
	{
		private DataColumn columnTypeID;

		private DataColumn columnName;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public DataColumn TypeIDColumn => columnTypeID;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public DataColumn NameColumn => columnName;

		[Browsable(false)]
		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public int Count => base.Rows.Count;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public rStockTypeRow this[int index] => (rStockTypeRow)base.Rows[index];

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public event rStockTypeRowChangeEventHandler rStockTypeRowChanging;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public event rStockTypeRowChangeEventHandler rStockTypeRowChanged;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public event rStockTypeRowChangeEventHandler rStockTypeRowDeleting;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public event rStockTypeRowChangeEventHandler rStockTypeRowDeleted;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public rStockTypeDataTable()
		{
			base.TableName = "rStockType";
			BeginInit();
			InitClass();
			EndInit();
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		internal rStockTypeDataTable(DataTable table)
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
		protected rStockTypeDataTable(SerializationInfo info, StreamingContext context)
			: base(info, context)
		{
			InitVars();
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public void AddrStockTypeRow(rStockTypeRow row)
		{
			base.Rows.Add(row);
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public rStockTypeRow AddrStockTypeRow(int TypeID, string Name)
		{
			rStockTypeRow rStockTypeRow = (rStockTypeRow)NewRow();
			object[] itemArray = new object[2] { TypeID, Name };
			rStockTypeRow.ItemArray = itemArray;
			base.Rows.Add(rStockTypeRow);
			return rStockTypeRow;
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public rStockTypeRow FindByTypeID(int TypeID)
		{
			return (rStockTypeRow)base.Rows.Find(new object[1] { TypeID });
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
			rStockTypeDataTable rStockTypeDataTable = (rStockTypeDataTable)base.Clone();
			rStockTypeDataTable.InitVars();
			return rStockTypeDataTable;
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		protected override DataTable CreateInstance()
		{
			return new rStockTypeDataTable();
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		internal void InitVars()
		{
			columnTypeID = base.Columns["TypeID"];
			columnName = base.Columns["Name"];
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		private void InitClass()
		{
			columnTypeID = new DataColumn("TypeID", typeof(int), null, MappingType.Element);
			base.Columns.Add(columnTypeID);
			columnName = new DataColumn("Name", typeof(string), null, MappingType.Element);
			base.Columns.Add(columnName);
			base.Constraints.Add(new UniqueConstraint("Constraint1", new DataColumn[1] { columnTypeID }, isPrimaryKey: true));
			columnTypeID.AllowDBNull = false;
			columnTypeID.Unique = true;
			columnName.MaxLength = 255;
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public rStockTypeRow NewrStockTypeRow()
		{
			return (rStockTypeRow)NewRow();
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		protected override DataRow NewRowFromBuilder(DataRowBuilder builder)
		{
			return new rStockTypeRow(builder);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		protected override Type GetRowType()
		{
			return typeof(rStockTypeRow);
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		protected override void OnRowChanged(DataRowChangeEventArgs e)
		{
			base.OnRowChanged(e);
			if (this.rStockTypeRowChanged != null)
			{
				this.rStockTypeRowChanged(this, new rStockTypeRowChangeEvent((rStockTypeRow)e.Row, e.Action));
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		protected override void OnRowChanging(DataRowChangeEventArgs e)
		{
			base.OnRowChanging(e);
			if (this.rStockTypeRowChanging != null)
			{
				this.rStockTypeRowChanging(this, new rStockTypeRowChangeEvent((rStockTypeRow)e.Row, e.Action));
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		protected override void OnRowDeleted(DataRowChangeEventArgs e)
		{
			base.OnRowDeleted(e);
			if (this.rStockTypeRowDeleted != null)
			{
				this.rStockTypeRowDeleted(this, new rStockTypeRowChangeEvent((rStockTypeRow)e.Row, e.Action));
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		protected override void OnRowDeleting(DataRowChangeEventArgs e)
		{
			base.OnRowDeleting(e);
			if (this.rStockTypeRowDeleting != null)
			{
				this.rStockTypeRowDeleting(this, new rStockTypeRowChangeEvent((rStockTypeRow)e.Row, e.Action));
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public void RemoverStockTypeRow(rStockTypeRow row)
		{
			base.Rows.Remove(row);
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public static XmlSchemaComplexType GetTypedTableSchema(XmlSchemaSet xs)
		{
			XmlSchemaComplexType xmlSchemaComplexType = new XmlSchemaComplexType();
			XmlSchemaSequence xmlSchemaSequence = new XmlSchemaSequence();
			ReportDataSet reportDataSet = new ReportDataSet();
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
			xmlSchemaAttribute.FixedValue = reportDataSet.Namespace;
			xmlSchemaComplexType.Attributes.Add(xmlSchemaAttribute);
			XmlSchemaAttribute xmlSchemaAttribute2 = new XmlSchemaAttribute();
			xmlSchemaAttribute2.Name = "tableTypeName";
			xmlSchemaAttribute2.FixedValue = "rStockTypeDataTable";
			xmlSchemaComplexType.Attributes.Add(xmlSchemaAttribute2);
			xmlSchemaComplexType.Particle = xmlSchemaSequence;
			XmlSchema schemaSerializable = reportDataSet.GetSchemaSerializable();
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
	public class ResultLogDataTable : DataTable, IEnumerable
	{
		private DataColumn columnMAC;

		private DataColumn columnName;

		private DataColumn columnFID;

		private DataColumn columnDateTime;

		private DataColumn columnSID;

		private DataColumn columnSalesman;

		private DataColumn columnCost;

		private DataColumn columnTax;

		private DataColumn columnDisRound;

		private DataColumn columnSfee;

		private DataColumn columnPayment_Card;

		private DataColumn columnPayment_Other_1;

		private DataColumn columnPayment_Other_2;

		private DataColumn columnPayment_Other_3;

		private DataColumn columnPayment_Total;

		private DataColumn columnSubNo;

		private DataColumn columnAlipay;

		private DataColumn columnWXpay;

		private DataColumn columnEpay2;

		private DataColumn columnEpay3;

		private DataColumn columnEpay4;

		private DataColumn columnEpay5;

		private DataColumn columnEpay6;

		private DataColumn columnEpay7;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public DataColumn MACColumn => columnMAC;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public DataColumn NameColumn => columnName;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public DataColumn FIDColumn => columnFID;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public DataColumn DateTimeColumn => columnDateTime;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public DataColumn SIDColumn => columnSID;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public DataColumn SalesmanColumn => columnSalesman;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public DataColumn CostColumn => columnCost;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public DataColumn TaxColumn => columnTax;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public DataColumn DisRoundColumn => columnDisRound;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public DataColumn SfeeColumn => columnSfee;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public DataColumn Payment_CardColumn => columnPayment_Card;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public DataColumn Payment_Other_1Column => columnPayment_Other_1;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public DataColumn Payment_Other_2Column => columnPayment_Other_2;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public DataColumn Payment_Other_3Column => columnPayment_Other_3;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public DataColumn Payment_TotalColumn => columnPayment_Total;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public DataColumn SubNoColumn => columnSubNo;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public DataColumn AlipayColumn => columnAlipay;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public DataColumn WXpayColumn => columnWXpay;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public DataColumn Epay2Column => columnEpay2;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public DataColumn Epay3Column => columnEpay3;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public DataColumn Epay4Column => columnEpay4;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public DataColumn Epay5Column => columnEpay5;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public DataColumn Epay6Column => columnEpay6;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public DataColumn Epay7Column => columnEpay7;

		[Browsable(false)]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public int Count => base.Rows.Count;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public ResultLogRow this[int index] => (ResultLogRow)base.Rows[index];

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public event ResultLogRowChangeEventHandler ResultLogRowChanging;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public event ResultLogRowChangeEventHandler ResultLogRowChanged;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public event ResultLogRowChangeEventHandler ResultLogRowDeleting;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public event ResultLogRowChangeEventHandler ResultLogRowDeleted;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public ResultLogDataTable()
		{
			base.TableName = "ResultLog";
			BeginInit();
			InitClass();
			EndInit();
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		internal ResultLogDataTable(DataTable table)
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
		protected ResultLogDataTable(SerializationInfo info, StreamingContext context)
			: base(info, context)
		{
			InitVars();
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public void AddResultLogRow(ResultLogRow row)
		{
			base.Rows.Add(row);
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public ResultLogRow AddResultLogRow(string MAC, string Name, int FID, DateTime DateTime, int SID, int Salesman, decimal Cost, decimal Tax, decimal DisRound, decimal Sfee, decimal Payment_Card, decimal Payment_Other_1, decimal Payment_Other_2, decimal Payment_Other_3, decimal Payment_Total, int SubNo, decimal Alipay, decimal WXpay, decimal Epay2, decimal Epay3, decimal Epay4, decimal Epay5, decimal Epay6, decimal Epay7)
		{
			ResultLogRow resultLogRow = (ResultLogRow)NewRow();
			object[] itemArray = new object[24]
			{
				MAC, Name, FID, DateTime, SID, Salesman, Cost, Tax, DisRound, Sfee,
				Payment_Card, Payment_Other_1, Payment_Other_2, Payment_Other_3, Payment_Total, SubNo, Alipay, WXpay, Epay2, Epay3,
				Epay4, Epay5, Epay6, Epay7
			};
			resultLogRow.ItemArray = itemArray;
			base.Rows.Add(resultLogRow);
			return resultLogRow;
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
			ResultLogDataTable resultLogDataTable = (ResultLogDataTable)base.Clone();
			resultLogDataTable.InitVars();
			return resultLogDataTable;
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		protected override DataTable CreateInstance()
		{
			return new ResultLogDataTable();
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		internal void InitVars()
		{
			columnMAC = base.Columns["MAC"];
			columnName = base.Columns["Name"];
			columnFID = base.Columns["FID"];
			columnDateTime = base.Columns["DateTime"];
			columnSID = base.Columns["SID"];
			columnSalesman = base.Columns["Salesman"];
			columnCost = base.Columns["Cost"];
			columnTax = base.Columns["Tax"];
			columnDisRound = base.Columns["DisRound"];
			columnSfee = base.Columns["Sfee"];
			columnPayment_Card = base.Columns["Payment_Card"];
			columnPayment_Other_1 = base.Columns["Payment_Other_1"];
			columnPayment_Other_2 = base.Columns["Payment_Other_2"];
			columnPayment_Other_3 = base.Columns["Payment_Other_3"];
			columnPayment_Total = base.Columns["Payment_Total"];
			columnSubNo = base.Columns["SubNo"];
			columnAlipay = base.Columns["Alipay"];
			columnWXpay = base.Columns["WXpay"];
			columnEpay2 = base.Columns["Epay2"];
			columnEpay3 = base.Columns["Epay3"];
			columnEpay4 = base.Columns["Epay4"];
			columnEpay5 = base.Columns["Epay5"];
			columnEpay6 = base.Columns["Epay6"];
			columnEpay7 = base.Columns["Epay7"];
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		private void InitClass()
		{
			columnMAC = new DataColumn("MAC", typeof(string), null, MappingType.Element);
			base.Columns.Add(columnMAC);
			columnName = new DataColumn("Name", typeof(string), null, MappingType.Element);
			base.Columns.Add(columnName);
			columnFID = new DataColumn("FID", typeof(int), null, MappingType.Element);
			base.Columns.Add(columnFID);
			columnDateTime = new DataColumn("DateTime", typeof(DateTime), null, MappingType.Element);
			base.Columns.Add(columnDateTime);
			columnSID = new DataColumn("SID", typeof(int), null, MappingType.Element);
			base.Columns.Add(columnSID);
			columnSalesman = new DataColumn("Salesman", typeof(int), null, MappingType.Element);
			base.Columns.Add(columnSalesman);
			columnCost = new DataColumn("Cost", typeof(decimal), null, MappingType.Element);
			base.Columns.Add(columnCost);
			columnTax = new DataColumn("Tax", typeof(decimal), null, MappingType.Element);
			base.Columns.Add(columnTax);
			columnDisRound = new DataColumn("DisRound", typeof(decimal), null, MappingType.Element);
			base.Columns.Add(columnDisRound);
			columnSfee = new DataColumn("Sfee", typeof(decimal), null, MappingType.Element);
			base.Columns.Add(columnSfee);
			columnPayment_Card = new DataColumn("Payment_Card", typeof(decimal), null, MappingType.Element);
			base.Columns.Add(columnPayment_Card);
			columnPayment_Other_1 = new DataColumn("Payment_Other_1", typeof(decimal), null, MappingType.Element);
			base.Columns.Add(columnPayment_Other_1);
			columnPayment_Other_2 = new DataColumn("Payment_Other_2", typeof(decimal), null, MappingType.Element);
			base.Columns.Add(columnPayment_Other_2);
			columnPayment_Other_3 = new DataColumn("Payment_Other_3", typeof(decimal), null, MappingType.Element);
			base.Columns.Add(columnPayment_Other_3);
			columnPayment_Total = new DataColumn("Payment_Total", typeof(decimal), null, MappingType.Element);
			base.Columns.Add(columnPayment_Total);
			columnSubNo = new DataColumn("SubNo", typeof(int), null, MappingType.Element);
			base.Columns.Add(columnSubNo);
			columnAlipay = new DataColumn("Alipay", typeof(decimal), null, MappingType.Element);
			base.Columns.Add(columnAlipay);
			columnWXpay = new DataColumn("WXpay", typeof(decimal), null, MappingType.Element);
			base.Columns.Add(columnWXpay);
			columnEpay2 = new DataColumn("Epay2", typeof(decimal), null, MappingType.Element);
			base.Columns.Add(columnEpay2);
			columnEpay3 = new DataColumn("Epay3", typeof(decimal), null, MappingType.Element);
			base.Columns.Add(columnEpay3);
			columnEpay4 = new DataColumn("Epay4", typeof(decimal), null, MappingType.Element);
			base.Columns.Add(columnEpay4);
			columnEpay5 = new DataColumn("Epay5", typeof(decimal), null, MappingType.Element);
			base.Columns.Add(columnEpay5);
			columnEpay6 = new DataColumn("Epay6", typeof(decimal), null, MappingType.Element);
			base.Columns.Add(columnEpay6);
			columnEpay7 = new DataColumn("Epay7", typeof(decimal), null, MappingType.Element);
			base.Columns.Add(columnEpay7);
			columnMAC.MaxLength = 255;
			columnName.MaxLength = 255;
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public ResultLogRow NewResultLogRow()
		{
			return (ResultLogRow)NewRow();
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		protected override DataRow NewRowFromBuilder(DataRowBuilder builder)
		{
			return new ResultLogRow(builder);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		protected override Type GetRowType()
		{
			return typeof(ResultLogRow);
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		protected override void OnRowChanged(DataRowChangeEventArgs e)
		{
			base.OnRowChanged(e);
			if (this.ResultLogRowChanged != null)
			{
				this.ResultLogRowChanged(this, new ResultLogRowChangeEvent((ResultLogRow)e.Row, e.Action));
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		protected override void OnRowChanging(DataRowChangeEventArgs e)
		{
			base.OnRowChanging(e);
			if (this.ResultLogRowChanging != null)
			{
				this.ResultLogRowChanging(this, new ResultLogRowChangeEvent((ResultLogRow)e.Row, e.Action));
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		protected override void OnRowDeleted(DataRowChangeEventArgs e)
		{
			base.OnRowDeleted(e);
			if (this.ResultLogRowDeleted != null)
			{
				this.ResultLogRowDeleted(this, new ResultLogRowChangeEvent((ResultLogRow)e.Row, e.Action));
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		protected override void OnRowDeleting(DataRowChangeEventArgs e)
		{
			base.OnRowDeleting(e);
			if (this.ResultLogRowDeleting != null)
			{
				this.ResultLogRowDeleting(this, new ResultLogRowChangeEvent((ResultLogRow)e.Row, e.Action));
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public void RemoveResultLogRow(ResultLogRow row)
		{
			base.Rows.Remove(row);
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public static XmlSchemaComplexType GetTypedTableSchema(XmlSchemaSet xs)
		{
			XmlSchemaComplexType xmlSchemaComplexType = new XmlSchemaComplexType();
			XmlSchemaSequence xmlSchemaSequence = new XmlSchemaSequence();
			ReportDataSet reportDataSet = new ReportDataSet();
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
			xmlSchemaAttribute.FixedValue = reportDataSet.Namespace;
			xmlSchemaComplexType.Attributes.Add(xmlSchemaAttribute);
			XmlSchemaAttribute xmlSchemaAttribute2 = new XmlSchemaAttribute();
			xmlSchemaAttribute2.Name = "tableTypeName";
			xmlSchemaAttribute2.FixedValue = "ResultLogDataTable";
			xmlSchemaComplexType.Attributes.Add(xmlSchemaAttribute2);
			xmlSchemaComplexType.Particle = xmlSchemaSequence;
			XmlSchema schemaSerializable = reportDataSet.GetSchemaSerializable();
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
	public class ResultLogItemDataTable : DataTable, IEnumerable
	{
		private DataColumn columnMAC;

		private DataColumn columnName;

		private DataColumn columnFID;

		private DataColumn columnDateTime;

		private DataColumn columnSID;

		private DataColumn columnSalesman;

		private DataColumn columnSubID;

		private DataColumn columnPrice;

		private DataColumn columnPLU;

		private DataColumn columnClass;

		private DataColumn columnDept;

		private DataColumn columnCost;

		private DataColumn columnUnit;

		private DataColumn columnType;

		private DataColumn columnTax;

		private DataColumn columnAmount;

		private DataColumn columnCount;

		private DataColumn columnWeight;

		private DataColumn columnText1;

		private DataColumn columnText2;

		private DataColumn columnText3;

		private DataColumn columnText4;

		private DataColumn columnUnitPrice;

		private DataColumn columnCoFID;

		private DataColumn columnPLUName;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public DataColumn MACColumn => columnMAC;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public DataColumn NameColumn => columnName;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public DataColumn FIDColumn => columnFID;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public DataColumn DateTimeColumn => columnDateTime;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public DataColumn SIDColumn => columnSID;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public DataColumn SalesmanColumn => columnSalesman;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public DataColumn SubIDColumn => columnSubID;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public DataColumn PriceColumn => columnPrice;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public DataColumn PLUColumn => columnPLU;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public DataColumn ClassColumn => columnClass;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public DataColumn DeptColumn => columnDept;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public DataColumn CostColumn => columnCost;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public DataColumn UnitColumn => columnUnit;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public DataColumn TypeColumn => columnType;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public DataColumn TaxColumn => columnTax;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public DataColumn AmountColumn => columnAmount;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public DataColumn CountColumn => columnCount;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public DataColumn WeightColumn => columnWeight;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public DataColumn Text1Column => columnText1;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public DataColumn Text2Column => columnText2;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public DataColumn Text3Column => columnText3;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public DataColumn Text4Column => columnText4;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public DataColumn UnitPriceColumn => columnUnitPrice;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public DataColumn CoFIDColumn => columnCoFID;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public DataColumn PLUNameColumn => columnPLUName;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		[Browsable(false)]
		public int Count => base.Rows.Count;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public ResultLogItemRow this[int index] => (ResultLogItemRow)base.Rows[index];

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public event ResultLogItemRowChangeEventHandler ResultLogItemRowChanging;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public event ResultLogItemRowChangeEventHandler ResultLogItemRowChanged;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public event ResultLogItemRowChangeEventHandler ResultLogItemRowDeleting;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public event ResultLogItemRowChangeEventHandler ResultLogItemRowDeleted;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public ResultLogItemDataTable()
		{
			base.TableName = "ResultLogItem";
			BeginInit();
			InitClass();
			EndInit();
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		internal ResultLogItemDataTable(DataTable table)
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
		protected ResultLogItemDataTable(SerializationInfo info, StreamingContext context)
			: base(info, context)
		{
			InitVars();
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public void AddResultLogItemRow(ResultLogItemRow row)
		{
			base.Rows.Add(row);
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public ResultLogItemRow AddResultLogItemRow(string MAC, string Name, int FID, DateTime DateTime, int SID, int Salesman, int SubID, decimal Price, int PLU, int Class, int Dept, decimal Cost, int Unit, int Type, decimal Tax, decimal Amount, decimal Count, decimal Weight, string Text1, string Text2, string Text3, string Text4, decimal UnitPrice, int CoFID, string PLUName)
		{
			ResultLogItemRow resultLogItemRow = (ResultLogItemRow)NewRow();
			object[] itemArray = new object[25]
			{
				MAC, Name, FID, DateTime, SID, Salesman, SubID, Price, PLU, Class,
				Dept, Cost, Unit, Type, Tax, Amount, Count, Weight, Text1, Text2,
				Text3, Text4, UnitPrice, CoFID, PLUName
			};
			resultLogItemRow.ItemArray = itemArray;
			base.Rows.Add(resultLogItemRow);
			return resultLogItemRow;
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
			ResultLogItemDataTable resultLogItemDataTable = (ResultLogItemDataTable)base.Clone();
			resultLogItemDataTable.InitVars();
			return resultLogItemDataTable;
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		protected override DataTable CreateInstance()
		{
			return new ResultLogItemDataTable();
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		internal void InitVars()
		{
			columnMAC = base.Columns["MAC"];
			columnName = base.Columns["Name"];
			columnFID = base.Columns["FID"];
			columnDateTime = base.Columns["DateTime"];
			columnSID = base.Columns["SID"];
			columnSalesman = base.Columns["Salesman"];
			columnSubID = base.Columns["SubID"];
			columnPrice = base.Columns["Price"];
			columnPLU = base.Columns["PLU"];
			columnClass = base.Columns["Class"];
			columnDept = base.Columns["Dept"];
			columnCost = base.Columns["Cost"];
			columnUnit = base.Columns["Unit"];
			columnType = base.Columns["Type"];
			columnTax = base.Columns["Tax"];
			columnAmount = base.Columns["Amount"];
			columnCount = base.Columns["Count"];
			columnWeight = base.Columns["Weight"];
			columnText1 = base.Columns["Text1"];
			columnText2 = base.Columns["Text2"];
			columnText3 = base.Columns["Text3"];
			columnText4 = base.Columns["Text4"];
			columnUnitPrice = base.Columns["UnitPrice"];
			columnCoFID = base.Columns["CoFID"];
			columnPLUName = base.Columns["PLUName"];
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		private void InitClass()
		{
			columnMAC = new DataColumn("MAC", typeof(string), null, MappingType.Element);
			base.Columns.Add(columnMAC);
			columnName = new DataColumn("Name", typeof(string), null, MappingType.Element);
			base.Columns.Add(columnName);
			columnFID = new DataColumn("FID", typeof(int), null, MappingType.Element);
			base.Columns.Add(columnFID);
			columnDateTime = new DataColumn("DateTime", typeof(DateTime), null, MappingType.Element);
			base.Columns.Add(columnDateTime);
			columnSID = new DataColumn("SID", typeof(int), null, MappingType.Element);
			base.Columns.Add(columnSID);
			columnSalesman = new DataColumn("Salesman", typeof(int), null, MappingType.Element);
			base.Columns.Add(columnSalesman);
			columnSubID = new DataColumn("SubID", typeof(int), null, MappingType.Element);
			base.Columns.Add(columnSubID);
			columnPrice = new DataColumn("Price", typeof(decimal), null, MappingType.Element);
			base.Columns.Add(columnPrice);
			columnPLU = new DataColumn("PLU", typeof(int), null, MappingType.Element);
			base.Columns.Add(columnPLU);
			columnClass = new DataColumn("Class", typeof(int), null, MappingType.Element);
			base.Columns.Add(columnClass);
			columnDept = new DataColumn("Dept", typeof(int), null, MappingType.Element);
			base.Columns.Add(columnDept);
			columnCost = new DataColumn("Cost", typeof(decimal), null, MappingType.Element);
			base.Columns.Add(columnCost);
			columnUnit = new DataColumn("Unit", typeof(int), null, MappingType.Element);
			base.Columns.Add(columnUnit);
			columnType = new DataColumn("Type", typeof(int), null, MappingType.Element);
			base.Columns.Add(columnType);
			columnTax = new DataColumn("Tax", typeof(decimal), null, MappingType.Element);
			base.Columns.Add(columnTax);
			columnAmount = new DataColumn("Amount", typeof(decimal), null, MappingType.Element);
			base.Columns.Add(columnAmount);
			columnCount = new DataColumn("Count", typeof(decimal), null, MappingType.Element);
			base.Columns.Add(columnCount);
			columnWeight = new DataColumn("Weight", typeof(decimal), null, MappingType.Element);
			base.Columns.Add(columnWeight);
			columnText1 = new DataColumn("Text1", typeof(string), null, MappingType.Element);
			base.Columns.Add(columnText1);
			columnText2 = new DataColumn("Text2", typeof(string), null, MappingType.Element);
			base.Columns.Add(columnText2);
			columnText3 = new DataColumn("Text3", typeof(string), null, MappingType.Element);
			base.Columns.Add(columnText3);
			columnText4 = new DataColumn("Text4", typeof(string), null, MappingType.Element);
			base.Columns.Add(columnText4);
			columnUnitPrice = new DataColumn("UnitPrice", typeof(decimal), null, MappingType.Element);
			base.Columns.Add(columnUnitPrice);
			columnCoFID = new DataColumn("CoFID", typeof(int), null, MappingType.Element);
			base.Columns.Add(columnCoFID);
			columnPLUName = new DataColumn("PLUName", typeof(string), null, MappingType.Element);
			base.Columns.Add(columnPLUName);
			columnMAC.MaxLength = 255;
			columnName.MaxLength = 255;
			columnAmount.DefaultValue = 0m;
			columnCount.DefaultValue = 0m;
			columnWeight.DefaultValue = 0m;
			columnText1.MaxLength = 255;
			columnText2.MaxLength = 255;
			columnText3.MaxLength = 255;
			columnText4.MaxLength = 255;
			columnPLUName.MaxLength = 255;
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public ResultLogItemRow NewResultLogItemRow()
		{
			return (ResultLogItemRow)NewRow();
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		protected override DataRow NewRowFromBuilder(DataRowBuilder builder)
		{
			return new ResultLogItemRow(builder);
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		protected override Type GetRowType()
		{
			return typeof(ResultLogItemRow);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		protected override void OnRowChanged(DataRowChangeEventArgs e)
		{
			base.OnRowChanged(e);
			if (this.ResultLogItemRowChanged != null)
			{
				this.ResultLogItemRowChanged(this, new ResultLogItemRowChangeEvent((ResultLogItemRow)e.Row, e.Action));
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		protected override void OnRowChanging(DataRowChangeEventArgs e)
		{
			base.OnRowChanging(e);
			if (this.ResultLogItemRowChanging != null)
			{
				this.ResultLogItemRowChanging(this, new ResultLogItemRowChangeEvent((ResultLogItemRow)e.Row, e.Action));
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		protected override void OnRowDeleted(DataRowChangeEventArgs e)
		{
			base.OnRowDeleted(e);
			if (this.ResultLogItemRowDeleted != null)
			{
				this.ResultLogItemRowDeleted(this, new ResultLogItemRowChangeEvent((ResultLogItemRow)e.Row, e.Action));
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		protected override void OnRowDeleting(DataRowChangeEventArgs e)
		{
			base.OnRowDeleting(e);
			if (this.ResultLogItemRowDeleting != null)
			{
				this.ResultLogItemRowDeleting(this, new ResultLogItemRowChangeEvent((ResultLogItemRow)e.Row, e.Action));
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public void RemoveResultLogItemRow(ResultLogItemRow row)
		{
			base.Rows.Remove(row);
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public static XmlSchemaComplexType GetTypedTableSchema(XmlSchemaSet xs)
		{
			XmlSchemaComplexType xmlSchemaComplexType = new XmlSchemaComplexType();
			XmlSchemaSequence xmlSchemaSequence = new XmlSchemaSequence();
			ReportDataSet reportDataSet = new ReportDataSet();
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
			xmlSchemaAttribute.FixedValue = reportDataSet.Namespace;
			xmlSchemaComplexType.Attributes.Add(xmlSchemaAttribute);
			XmlSchemaAttribute xmlSchemaAttribute2 = new XmlSchemaAttribute();
			xmlSchemaAttribute2.Name = "tableTypeName";
			xmlSchemaAttribute2.FixedValue = "ResultLogItemDataTable";
			xmlSchemaComplexType.Attributes.Add(xmlSchemaAttribute2);
			xmlSchemaComplexType.Particle = xmlSchemaSequence;
			XmlSchema schemaSerializable = reportDataSet.GetSchemaSerializable();
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
	public class HistoryDataTable : DataTable, IEnumerable
	{
		private DataColumn columnFileName;

		private DataColumn columnStart;

		private DataColumn columnEnd;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public DataColumn FileNameColumn => columnFileName;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public DataColumn StartColumn => columnStart;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public DataColumn EndColumn => columnEnd;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[Browsable(false)]
		public int Count => base.Rows.Count;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public HistoryRow this[int index] => (HistoryRow)base.Rows[index];

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public event HistoryRowChangeEventHandler HistoryRowChanging;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public event HistoryRowChangeEventHandler HistoryRowChanged;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public event HistoryRowChangeEventHandler HistoryRowDeleting;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public event HistoryRowChangeEventHandler HistoryRowDeleted;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public HistoryDataTable()
		{
			base.TableName = "History";
			BeginInit();
			InitClass();
			EndInit();
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		internal HistoryDataTable(DataTable table)
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
		protected HistoryDataTable(SerializationInfo info, StreamingContext context)
			: base(info, context)
		{
			InitVars();
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public void AddHistoryRow(HistoryRow row)
		{
			base.Rows.Add(row);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public HistoryRow AddHistoryRow(string FileName, DateTime Start, DateTime End)
		{
			HistoryRow historyRow = (HistoryRow)NewRow();
			object[] itemArray = new object[3] { FileName, Start, End };
			historyRow.ItemArray = itemArray;
			base.Rows.Add(historyRow);
			return historyRow;
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public HistoryRow FindByFileName(string FileName)
		{
			return (HistoryRow)base.Rows.Find(new object[1] { FileName });
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
			HistoryDataTable historyDataTable = (HistoryDataTable)base.Clone();
			historyDataTable.InitVars();
			return historyDataTable;
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		protected override DataTable CreateInstance()
		{
			return new HistoryDataTable();
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		internal void InitVars()
		{
			columnFileName = base.Columns["FileName"];
			columnStart = base.Columns["Start"];
			columnEnd = base.Columns["End"];
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		private void InitClass()
		{
			columnFileName = new DataColumn("FileName", typeof(string), null, MappingType.Element);
			base.Columns.Add(columnFileName);
			columnStart = new DataColumn("Start", typeof(DateTime), null, MappingType.Element);
			base.Columns.Add(columnStart);
			columnEnd = new DataColumn("End", typeof(DateTime), null, MappingType.Element);
			base.Columns.Add(columnEnd);
			base.Constraints.Add(new UniqueConstraint("Constraint1", new DataColumn[1] { columnFileName }, isPrimaryKey: true));
			columnFileName.AllowDBNull = false;
			columnFileName.Unique = true;
			columnFileName.MaxLength = 255;
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public HistoryRow NewHistoryRow()
		{
			return (HistoryRow)NewRow();
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		protected override DataRow NewRowFromBuilder(DataRowBuilder builder)
		{
			return new HistoryRow(builder);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		protected override Type GetRowType()
		{
			return typeof(HistoryRow);
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		protected override void OnRowChanged(DataRowChangeEventArgs e)
		{
			base.OnRowChanged(e);
			if (this.HistoryRowChanged != null)
			{
				this.HistoryRowChanged(this, new HistoryRowChangeEvent((HistoryRow)e.Row, e.Action));
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		protected override void OnRowChanging(DataRowChangeEventArgs e)
		{
			base.OnRowChanging(e);
			if (this.HistoryRowChanging != null)
			{
				this.HistoryRowChanging(this, new HistoryRowChangeEvent((HistoryRow)e.Row, e.Action));
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		protected override void OnRowDeleted(DataRowChangeEventArgs e)
		{
			base.OnRowDeleted(e);
			if (this.HistoryRowDeleted != null)
			{
				this.HistoryRowDeleted(this, new HistoryRowChangeEvent((HistoryRow)e.Row, e.Action));
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		protected override void OnRowDeleting(DataRowChangeEventArgs e)
		{
			base.OnRowDeleting(e);
			if (this.HistoryRowDeleting != null)
			{
				this.HistoryRowDeleting(this, new HistoryRowChangeEvent((HistoryRow)e.Row, e.Action));
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public void RemoveHistoryRow(HistoryRow row)
		{
			base.Rows.Remove(row);
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public static XmlSchemaComplexType GetTypedTableSchema(XmlSchemaSet xs)
		{
			XmlSchemaComplexType xmlSchemaComplexType = new XmlSchemaComplexType();
			XmlSchemaSequence xmlSchemaSequence = new XmlSchemaSequence();
			ReportDataSet reportDataSet = new ReportDataSet();
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
			xmlSchemaAttribute.FixedValue = reportDataSet.Namespace;
			xmlSchemaComplexType.Attributes.Add(xmlSchemaAttribute);
			XmlSchemaAttribute xmlSchemaAttribute2 = new XmlSchemaAttribute();
			xmlSchemaAttribute2.Name = "tableTypeName";
			xmlSchemaAttribute2.FixedValue = "HistoryDataTable";
			xmlSchemaComplexType.Attributes.Add(xmlSchemaAttribute2);
			xmlSchemaComplexType.Particle = xmlSchemaSequence;
			XmlSchema schemaSerializable = reportDataSet.GetSchemaSerializable();
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
	public class StockMultiItemDataTable : DataTable, IEnumerable
	{
		private DataColumn columnPLU;

		private DataColumn columnSTakingTime;

		private DataColumn columnStock;

		private DataColumn columnUnit;

		private DataColumn columnSafetyStock;

		private DataColumn columnLowStock;

		private DataColumn columnType;

		private DataColumn columnUnit_Price;

		private DataColumn columnAmount;

		private DataColumn columnStockSP;

		private DataColumn columnUnitSP;

		private DataColumn columnPriceIn;

		private DataColumn columnPriceOut;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public DataColumn PLUColumn => columnPLU;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public DataColumn STakingTimeColumn => columnSTakingTime;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public DataColumn StockColumn => columnStock;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public DataColumn UnitColumn => columnUnit;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public DataColumn SafetyStockColumn => columnSafetyStock;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public DataColumn LowStockColumn => columnLowStock;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public DataColumn TypeColumn => columnType;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public DataColumn Unit_PriceColumn => columnUnit_Price;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public DataColumn AmountColumn => columnAmount;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public DataColumn StockSPColumn => columnStockSP;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public DataColumn UnitSPColumn => columnUnitSP;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public DataColumn PriceInColumn => columnPriceIn;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public DataColumn PriceOutColumn => columnPriceOut;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		[Browsable(false)]
		public int Count => base.Rows.Count;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public StockMultiItemRow this[int index] => (StockMultiItemRow)base.Rows[index];

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public event StockMultiItemRowChangeEventHandler StockMultiItemRowChanging;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public event StockMultiItemRowChangeEventHandler StockMultiItemRowChanged;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public event StockMultiItemRowChangeEventHandler StockMultiItemRowDeleting;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public event StockMultiItemRowChangeEventHandler StockMultiItemRowDeleted;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public StockMultiItemDataTable()
		{
			base.TableName = "StockMultiItem";
			BeginInit();
			InitClass();
			EndInit();
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		internal StockMultiItemDataTable(DataTable table)
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
		protected StockMultiItemDataTable(SerializationInfo info, StreamingContext context)
			: base(info, context)
		{
			InitVars();
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public void AddStockMultiItemRow(StockMultiItemRow row)
		{
			base.Rows.Add(row);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public StockMultiItemRow AddStockMultiItemRow(int PLU, DateTime STakingTime, decimal Stock, int Unit, decimal SafetyStock, bool LowStock, int Type, decimal Unit_Price, decimal Amount, decimal StockSP, int UnitSP, decimal PriceIn, decimal PriceOut)
		{
			StockMultiItemRow stockMultiItemRow = (StockMultiItemRow)NewRow();
			object[] itemArray = new object[13]
			{
				PLU, STakingTime, Stock, Unit, SafetyStock, LowStock, Type, Unit_Price, Amount, StockSP,
				UnitSP, PriceIn, PriceOut
			};
			stockMultiItemRow.ItemArray = itemArray;
			base.Rows.Add(stockMultiItemRow);
			return stockMultiItemRow;
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public StockMultiItemRow FindByPLU(int PLU)
		{
			return (StockMultiItemRow)base.Rows.Find(new object[1] { PLU });
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
			StockMultiItemDataTable stockMultiItemDataTable = (StockMultiItemDataTable)base.Clone();
			stockMultiItemDataTable.InitVars();
			return stockMultiItemDataTable;
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		protected override DataTable CreateInstance()
		{
			return new StockMultiItemDataTable();
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		internal void InitVars()
		{
			columnPLU = base.Columns["PLU"];
			columnSTakingTime = base.Columns["STakingTime"];
			columnStock = base.Columns["Stock"];
			columnUnit = base.Columns["Unit"];
			columnSafetyStock = base.Columns["SafetyStock"];
			columnLowStock = base.Columns["LowStock"];
			columnType = base.Columns["Type"];
			columnUnit_Price = base.Columns["Unit Price"];
			columnAmount = base.Columns["Amount"];
			columnStockSP = base.Columns["StockSP"];
			columnUnitSP = base.Columns["UnitSP"];
			columnPriceIn = base.Columns["PriceIn"];
			columnPriceOut = base.Columns["PriceOut"];
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		private void InitClass()
		{
			columnPLU = new DataColumn("PLU", typeof(int), null, MappingType.Element);
			base.Columns.Add(columnPLU);
			columnSTakingTime = new DataColumn("STakingTime", typeof(DateTime), null, MappingType.Element);
			base.Columns.Add(columnSTakingTime);
			columnStock = new DataColumn("Stock", typeof(decimal), null, MappingType.Element);
			base.Columns.Add(columnStock);
			columnUnit = new DataColumn("Unit", typeof(int), null, MappingType.Element);
			base.Columns.Add(columnUnit);
			columnSafetyStock = new DataColumn("SafetyStock", typeof(decimal), null, MappingType.Element);
			base.Columns.Add(columnSafetyStock);
			columnLowStock = new DataColumn("LowStock", typeof(bool), null, MappingType.Element);
			base.Columns.Add(columnLowStock);
			columnType = new DataColumn("Type", typeof(int), null, MappingType.Element);
			base.Columns.Add(columnType);
			columnUnit_Price = new DataColumn("Unit Price", typeof(decimal), null, MappingType.Element);
			base.Columns.Add(columnUnit_Price);
			columnAmount = new DataColumn("Amount", typeof(decimal), null, MappingType.Element);
			base.Columns.Add(columnAmount);
			columnStockSP = new DataColumn("StockSP", typeof(decimal), null, MappingType.Element);
			base.Columns.Add(columnStockSP);
			columnUnitSP = new DataColumn("UnitSP", typeof(int), null, MappingType.Element);
			base.Columns.Add(columnUnitSP);
			columnPriceIn = new DataColumn("PriceIn", typeof(decimal), null, MappingType.Element);
			base.Columns.Add(columnPriceIn);
			columnPriceOut = new DataColumn("PriceOut", typeof(decimal), null, MappingType.Element);
			base.Columns.Add(columnPriceOut);
			base.Constraints.Add(new UniqueConstraint("Constraint1", new DataColumn[1] { columnPLU }, isPrimaryKey: true));
			columnPLU.AllowDBNull = false;
			columnPLU.Unique = true;
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public StockMultiItemRow NewStockMultiItemRow()
		{
			return (StockMultiItemRow)NewRow();
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		protected override DataRow NewRowFromBuilder(DataRowBuilder builder)
		{
			return new StockMultiItemRow(builder);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		protected override Type GetRowType()
		{
			return typeof(StockMultiItemRow);
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		protected override void OnRowChanged(DataRowChangeEventArgs e)
		{
			base.OnRowChanged(e);
			if (this.StockMultiItemRowChanged != null)
			{
				this.StockMultiItemRowChanged(this, new StockMultiItemRowChangeEvent((StockMultiItemRow)e.Row, e.Action));
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		protected override void OnRowChanging(DataRowChangeEventArgs e)
		{
			base.OnRowChanging(e);
			if (this.StockMultiItemRowChanging != null)
			{
				this.StockMultiItemRowChanging(this, new StockMultiItemRowChangeEvent((StockMultiItemRow)e.Row, e.Action));
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		protected override void OnRowDeleted(DataRowChangeEventArgs e)
		{
			base.OnRowDeleted(e);
			if (this.StockMultiItemRowDeleted != null)
			{
				this.StockMultiItemRowDeleted(this, new StockMultiItemRowChangeEvent((StockMultiItemRow)e.Row, e.Action));
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		protected override void OnRowDeleting(DataRowChangeEventArgs e)
		{
			base.OnRowDeleting(e);
			if (this.StockMultiItemRowDeleting != null)
			{
				this.StockMultiItemRowDeleting(this, new StockMultiItemRowChangeEvent((StockMultiItemRow)e.Row, e.Action));
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public void RemoveStockMultiItemRow(StockMultiItemRow row)
		{
			base.Rows.Remove(row);
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public static XmlSchemaComplexType GetTypedTableSchema(XmlSchemaSet xs)
		{
			XmlSchemaComplexType xmlSchemaComplexType = new XmlSchemaComplexType();
			XmlSchemaSequence xmlSchemaSequence = new XmlSchemaSequence();
			ReportDataSet reportDataSet = new ReportDataSet();
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
			xmlSchemaAttribute.FixedValue = reportDataSet.Namespace;
			xmlSchemaComplexType.Attributes.Add(xmlSchemaAttribute);
			XmlSchemaAttribute xmlSchemaAttribute2 = new XmlSchemaAttribute();
			xmlSchemaAttribute2.Name = "tableTypeName";
			xmlSchemaAttribute2.FixedValue = "StockMultiItemDataTable";
			xmlSchemaComplexType.Attributes.Add(xmlSchemaAttribute2);
			xmlSchemaComplexType.Particle = xmlSchemaSequence;
			XmlSchema schemaSerializable = reportDataSet.GetSchemaSerializable();
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
	public class StockExcelItemDataTable : DataTable, IEnumerable
	{
		private DataColumn columnID;

		private DataColumn columnPLU;

		private DataColumn columnType;

		private DataColumn columnUnit_Price;

		private DataColumn columnTotal_Price;

		private DataColumn columnAmount;

		private DataColumn columnUnit;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public DataColumn IDColumn => columnID;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public DataColumn PLUColumn => columnPLU;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public DataColumn TypeColumn => columnType;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public DataColumn Unit_PriceColumn => columnUnit_Price;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public DataColumn Total_PriceColumn => columnTotal_Price;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public DataColumn AmountColumn => columnAmount;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public DataColumn UnitColumn => columnUnit;

		[Browsable(false)]
		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public int Count => base.Rows.Count;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public StockExcelItemRow this[int index] => (StockExcelItemRow)base.Rows[index];

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public event StockExcelItemRowChangeEventHandler StockExcelItemRowChanging;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public event StockExcelItemRowChangeEventHandler StockExcelItemRowChanged;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public event StockExcelItemRowChangeEventHandler StockExcelItemRowDeleting;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public event StockExcelItemRowChangeEventHandler StockExcelItemRowDeleted;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public StockExcelItemDataTable()
		{
			base.TableName = "StockExcelItem";
			BeginInit();
			InitClass();
			EndInit();
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		internal StockExcelItemDataTable(DataTable table)
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
		protected StockExcelItemDataTable(SerializationInfo info, StreamingContext context)
			: base(info, context)
		{
			InitVars();
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public void AddStockExcelItemRow(StockExcelItemRow row)
		{
			base.Rows.Add(row);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public StockExcelItemRow AddStockExcelItemRow(int PLU, int Type, decimal Unit_Price, decimal Total_Price, decimal Amount, int Unit)
		{
			StockExcelItemRow stockExcelItemRow = (StockExcelItemRow)NewRow();
			object[] itemArray = new object[7] { null, PLU, Type, Unit_Price, Total_Price, Amount, Unit };
			stockExcelItemRow.ItemArray = itemArray;
			base.Rows.Add(stockExcelItemRow);
			return stockExcelItemRow;
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public StockExcelItemRow FindByID(int ID)
		{
			return (StockExcelItemRow)base.Rows.Find(new object[1] { ID });
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
			StockExcelItemDataTable stockExcelItemDataTable = (StockExcelItemDataTable)base.Clone();
			stockExcelItemDataTable.InitVars();
			return stockExcelItemDataTable;
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		protected override DataTable CreateInstance()
		{
			return new StockExcelItemDataTable();
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		internal void InitVars()
		{
			columnID = base.Columns["ID"];
			columnPLU = base.Columns["PLU"];
			columnType = base.Columns["Type"];
			columnUnit_Price = base.Columns["Unit Price"];
			columnTotal_Price = base.Columns["Total Price"];
			columnAmount = base.Columns["Amount"];
			columnUnit = base.Columns["Unit"];
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		private void InitClass()
		{
			columnID = new DataColumn("ID", typeof(int), null, MappingType.Element);
			base.Columns.Add(columnID);
			columnPLU = new DataColumn("PLU", typeof(int), null, MappingType.Element);
			base.Columns.Add(columnPLU);
			columnType = new DataColumn("Type", typeof(int), null, MappingType.Element);
			base.Columns.Add(columnType);
			columnUnit_Price = new DataColumn("Unit Price", typeof(decimal), null, MappingType.Element);
			base.Columns.Add(columnUnit_Price);
			columnTotal_Price = new DataColumn("Total Price", typeof(decimal), null, MappingType.Element);
			base.Columns.Add(columnTotal_Price);
			columnAmount = new DataColumn("Amount", typeof(decimal), null, MappingType.Element);
			base.Columns.Add(columnAmount);
			columnUnit = new DataColumn("Unit", typeof(int), null, MappingType.Element);
			base.Columns.Add(columnUnit);
			base.Constraints.Add(new UniqueConstraint("Constraint1", new DataColumn[1] { columnID }, isPrimaryKey: true));
			columnID.AutoIncrement = true;
			columnID.AutoIncrementSeed = 1L;
			columnID.AllowDBNull = false;
			columnID.Unique = true;
			columnPLU.AllowDBNull = false;
			columnTotal_Price.Caption = "Unit Price";
			columnUnit.Caption = "UnitSP";
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public StockExcelItemRow NewStockExcelItemRow()
		{
			return (StockExcelItemRow)NewRow();
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		protected override DataRow NewRowFromBuilder(DataRowBuilder builder)
		{
			return new StockExcelItemRow(builder);
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		protected override Type GetRowType()
		{
			return typeof(StockExcelItemRow);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		protected override void OnRowChanged(DataRowChangeEventArgs e)
		{
			base.OnRowChanged(e);
			if (this.StockExcelItemRowChanged != null)
			{
				this.StockExcelItemRowChanged(this, new StockExcelItemRowChangeEvent((StockExcelItemRow)e.Row, e.Action));
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		protected override void OnRowChanging(DataRowChangeEventArgs e)
		{
			base.OnRowChanging(e);
			if (this.StockExcelItemRowChanging != null)
			{
				this.StockExcelItemRowChanging(this, new StockExcelItemRowChangeEvent((StockExcelItemRow)e.Row, e.Action));
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		protected override void OnRowDeleted(DataRowChangeEventArgs e)
		{
			base.OnRowDeleted(e);
			if (this.StockExcelItemRowDeleted != null)
			{
				this.StockExcelItemRowDeleted(this, new StockExcelItemRowChangeEvent((StockExcelItemRow)e.Row, e.Action));
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		protected override void OnRowDeleting(DataRowChangeEventArgs e)
		{
			base.OnRowDeleting(e);
			if (this.StockExcelItemRowDeleting != null)
			{
				this.StockExcelItemRowDeleting(this, new StockExcelItemRowChangeEvent((StockExcelItemRow)e.Row, e.Action));
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public void RemoveStockExcelItemRow(StockExcelItemRow row)
		{
			base.Rows.Remove(row);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public static XmlSchemaComplexType GetTypedTableSchema(XmlSchemaSet xs)
		{
			XmlSchemaComplexType xmlSchemaComplexType = new XmlSchemaComplexType();
			XmlSchemaSequence xmlSchemaSequence = new XmlSchemaSequence();
			ReportDataSet reportDataSet = new ReportDataSet();
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
			xmlSchemaAttribute.FixedValue = reportDataSet.Namespace;
			xmlSchemaComplexType.Attributes.Add(xmlSchemaAttribute);
			XmlSchemaAttribute xmlSchemaAttribute2 = new XmlSchemaAttribute();
			xmlSchemaAttribute2.Name = "tableTypeName";
			xmlSchemaAttribute2.FixedValue = "StockExcelItemDataTable";
			xmlSchemaComplexType.Attributes.Add(xmlSchemaAttribute2);
			xmlSchemaComplexType.Particle = xmlSchemaSequence;
			XmlSchema schemaSerializable = reportDataSet.GetSchemaSerializable();
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

	public class ExprRow : DataRow
	{
		private ExprDataTable tableExpr;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public int ID
		{
			get
			{
				return (int)base[tableExpr.IDColumn];
			}
			set
			{
				base[tableExpr.IDColumn] = value;
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public bool Not
		{
			get
			{
				if (IsNotNull())
				{
					return false;
				}
				return (bool)base[tableExpr.NotColumn];
			}
			set
			{
				base[tableExpr.NotColumn] = value;
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public string AndOr
		{
			get
			{
				if (IsAndOrNull())
				{
					return string.Empty;
				}
				return (string)base[tableExpr.AndOrColumn];
			}
			set
			{
				base[tableExpr.AndOrColumn] = value;
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public string Field
		{
			get
			{
				if (IsFieldNull())
				{
					return string.Empty;
				}
				return (string)base[tableExpr.FieldColumn];
			}
			set
			{
				base[tableExpr.FieldColumn] = value;
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public string Op
		{
			get
			{
				if (IsOpNull())
				{
					return string.Empty;
				}
				return (string)base[tableExpr.OpColumn];
			}
			set
			{
				base[tableExpr.OpColumn] = value;
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public string Expr1
		{
			get
			{
				if (IsExpr1Null())
				{
					return string.Empty;
				}
				return (string)base[tableExpr.Expr1Column];
			}
			set
			{
				base[tableExpr.Expr1Column] = value;
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public string Expr2
		{
			get
			{
				if (IsExpr2Null())
				{
					return string.Empty;
				}
				return (string)base[tableExpr.Expr2Column];
			}
			set
			{
				base[tableExpr.Expr2Column] = value;
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
				return (string)base[tableExpr.DisplayColumn];
			}
			set
			{
				base[tableExpr.DisplayColumn] = value;
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		internal ExprRow(DataRowBuilder rb)
			: base(rb)
		{
			tableExpr = (ExprDataTable)base.Table;
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public bool IsNotNull()
		{
			return IsNull(tableExpr.NotColumn);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public void SetNotNull()
		{
			base[tableExpr.NotColumn] = Convert.DBNull;
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public bool IsAndOrNull()
		{
			return IsNull(tableExpr.AndOrColumn);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public void SetAndOrNull()
		{
			base[tableExpr.AndOrColumn] = Convert.DBNull;
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public bool IsFieldNull()
		{
			return IsNull(tableExpr.FieldColumn);
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public void SetFieldNull()
		{
			base[tableExpr.FieldColumn] = Convert.DBNull;
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public bool IsOpNull()
		{
			return IsNull(tableExpr.OpColumn);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public void SetOpNull()
		{
			base[tableExpr.OpColumn] = Convert.DBNull;
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public bool IsExpr1Null()
		{
			return IsNull(tableExpr.Expr1Column);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public void SetExpr1Null()
		{
			base[tableExpr.Expr1Column] = Convert.DBNull;
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public bool IsExpr2Null()
		{
			return IsNull(tableExpr.Expr2Column);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public void SetExpr2Null()
		{
			base[tableExpr.Expr2Column] = Convert.DBNull;
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public bool IsDisplayNull()
		{
			return IsNull(tableExpr.DisplayColumn);
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public void SetDisplayNull()
		{
			base[tableExpr.DisplayColumn] = Convert.DBNull;
		}
	}

	public class ExcelRow : DataRow
	{
		private ExcelDataTable tableExcel;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public int ID
		{
			get
			{
				return (int)base[tableExcel.IDColumn];
			}
			set
			{
				base[tableExcel.IDColumn] = value;
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public string Field
		{
			get
			{
				if (IsFieldNull())
				{
					return string.Empty;
				}
				return (string)base[tableExcel.FieldColumn];
			}
			set
			{
				base[tableExcel.FieldColumn] = value;
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		internal ExcelRow(DataRowBuilder rb)
			: base(rb)
		{
			tableExcel = (ExcelDataTable)base.Table;
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public bool IsFieldNull()
		{
			return IsNull(tableExcel.FieldColumn);
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public void SetFieldNull()
		{
			base[tableExcel.FieldColumn] = Convert.DBNull;
		}
	}

	public class DeviceRow : DataRow
	{
		private DeviceDataTable tableDevice;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public string MAC
		{
			get
			{
				return (string)base[tableDevice.MACColumn];
			}
			set
			{
				base[tableDevice.MACColumn] = value;
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public string Name
		{
			get
			{
				try
				{
					return (string)base[tableDevice.NameColumn];
				}
				catch (InvalidCastException innerException)
				{
					throw new StrongTypingException("表“Device”中列“Name”的值为 DBNull。", innerException);
				}
			}
			set
			{
				base[tableDevice.NameColumn] = value;
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public int GID
		{
			get
			{
				try
				{
					return (int)base[tableDevice.GIDColumn];
				}
				catch (InvalidCastException innerException)
				{
					throw new StrongTypingException("表“Device”中列“GID”的值为 DBNull。", innerException);
				}
			}
			set
			{
				base[tableDevice.GIDColumn] = value;
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public int FIDed
		{
			get
			{
				if (IsFIDedNull())
				{
					return 0;
				}
				return (int)base[tableDevice.FIDedColumn];
			}
			set
			{
				base[tableDevice.FIDedColumn] = value;
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public SGroupRow SGroupRow
		{
			get
			{
				return (SGroupRow)GetParentRow(base.Table.ParentRelations["FK_SGroup_Device"]);
			}
			set
			{
				SetParentRow(value, base.Table.ParentRelations["FK_SGroup_Device"]);
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		internal DeviceRow(DataRowBuilder rb)
			: base(rb)
		{
			tableDevice = (DeviceDataTable)base.Table;
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public bool IsNameNull()
		{
			return IsNull(tableDevice.NameColumn);
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public void SetNameNull()
		{
			base[tableDevice.NameColumn] = Convert.DBNull;
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public bool IsGIDNull()
		{
			return IsNull(tableDevice.GIDColumn);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public void SetGIDNull()
		{
			base[tableDevice.GIDColumn] = Convert.DBNull;
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public bool IsFIDedNull()
		{
			return IsNull(tableDevice.FIDedColumn);
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public void SetFIDedNull()
		{
			base[tableDevice.FIDedColumn] = Convert.DBNull;
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public LogRow[] GetLogRows()
		{
			if (base.Table.ChildRelations["FK_Device_Log"] == null)
			{
				return new LogRow[0];
			}
			return (LogRow[])GetChildRows(base.Table.ChildRelations["FK_Device_Log"]);
		}
	}

	public class LogRow : DataRow
	{
		private LogDataTable tableLog;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public string MAC
		{
			get
			{
				return (string)base[tableLog.MACColumn];
			}
			set
			{
				base[tableLog.MACColumn] = value;
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public int FID
		{
			get
			{
				return (int)base[tableLog.FIDColumn];
			}
			set
			{
				base[tableLog.FIDColumn] = value;
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public DateTime DateTime
		{
			get
			{
				try
				{
					return (DateTime)base[tableLog.DateTimeColumn];
				}
				catch (InvalidCastException innerException)
				{
					throw new StrongTypingException("表“Log”中列“DateTime”的值为 DBNull。", innerException);
				}
			}
			set
			{
				base[tableLog.DateTimeColumn] = value;
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public int SID
		{
			get
			{
				if (IsSIDNull())
				{
					return 0;
				}
				return (int)base[tableLog.SIDColumn];
			}
			set
			{
				base[tableLog.SIDColumn] = value;
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public int Salesman
		{
			get
			{
				if (IsSalesmanNull())
				{
					return 0;
				}
				return (int)base[tableLog.SalesmanColumn];
			}
			set
			{
				base[tableLog.SalesmanColumn] = value;
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public decimal DisRound
		{
			get
			{
				try
				{
					return (decimal)base[tableLog.DisRoundColumn];
				}
				catch (InvalidCastException innerException)
				{
					throw new StrongTypingException("表“Log”中列“DisRound”的值为 DBNull。", innerException);
				}
			}
			set
			{
				base[tableLog.DisRoundColumn] = value;
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public decimal Sfee
		{
			get
			{
				try
				{
					return (decimal)base[tableLog.SfeeColumn];
				}
				catch (InvalidCastException innerException)
				{
					throw new StrongTypingException("表“Log”中列“Sfee”的值为 DBNull。", innerException);
				}
			}
			set
			{
				base[tableLog.SfeeColumn] = value;
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public decimal Payment_Card
		{
			get
			{
				try
				{
					return (decimal)base[tableLog.Payment_CardColumn];
				}
				catch (InvalidCastException innerException)
				{
					throw new StrongTypingException("表“Log”中列“Payment_Card”的值为 DBNull。", innerException);
				}
			}
			set
			{
				base[tableLog.Payment_CardColumn] = value;
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public decimal Payment_Other_1
		{
			get
			{
				try
				{
					return (decimal)base[tableLog.Payment_Other_1Column];
				}
				catch (InvalidCastException innerException)
				{
					throw new StrongTypingException("表“Log”中列“Payment_Other_1”的值为 DBNull。", innerException);
				}
			}
			set
			{
				base[tableLog.Payment_Other_1Column] = value;
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public decimal Payment_Other_2
		{
			get
			{
				try
				{
					return (decimal)base[tableLog.Payment_Other_2Column];
				}
				catch (InvalidCastException innerException)
				{
					throw new StrongTypingException("表“Log”中列“Payment_Other_2”的值为 DBNull。", innerException);
				}
			}
			set
			{
				base[tableLog.Payment_Other_2Column] = value;
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public decimal Payment_Other_3
		{
			get
			{
				try
				{
					return (decimal)base[tableLog.Payment_Other_3Column];
				}
				catch (InvalidCastException innerException)
				{
					throw new StrongTypingException("表“Log”中列“Payment_Other_3”的值为 DBNull。", innerException);
				}
			}
			set
			{
				base[tableLog.Payment_Other_3Column] = value;
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public decimal Payment_Total
		{
			get
			{
				try
				{
					return (decimal)base[tableLog.Payment_TotalColumn];
				}
				catch (InvalidCastException innerException)
				{
					throw new StrongTypingException("表“Log”中列“Payment_Total”的值为 DBNull。", innerException);
				}
			}
			set
			{
				base[tableLog.Payment_TotalColumn] = value;
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public decimal Tax
		{
			get
			{
				try
				{
					return (decimal)base[tableLog.TaxColumn];
				}
				catch (InvalidCastException innerException)
				{
					throw new StrongTypingException("表“Log”中列“Tax”的值为 DBNull。", innerException);
				}
			}
			set
			{
				base[tableLog.TaxColumn] = value;
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public decimal Cost
		{
			get
			{
				try
				{
					return (decimal)base[tableLog.CostColumn];
				}
				catch (InvalidCastException innerException)
				{
					throw new StrongTypingException("表“Log”中列“Cost”的值为 DBNull。", innerException);
				}
			}
			set
			{
				base[tableLog.CostColumn] = value;
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public int SubNo
		{
			get
			{
				try
				{
					return (int)base[tableLog.SubNoColumn];
				}
				catch (InvalidCastException innerException)
				{
					throw new StrongTypingException("表“Log”中列“SubNo”的值为 DBNull。", innerException);
				}
			}
			set
			{
				base[tableLog.SubNoColumn] = value;
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public decimal Alipay
		{
			get
			{
				try
				{
					return (decimal)base[tableLog.AlipayColumn];
				}
				catch (InvalidCastException innerException)
				{
					throw new StrongTypingException("表“Log”中列“Alipay”的值为 DBNull。", innerException);
				}
			}
			set
			{
				base[tableLog.AlipayColumn] = value;
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public decimal WXpay
		{
			get
			{
				try
				{
					return (decimal)base[tableLog.WXpayColumn];
				}
				catch (InvalidCastException innerException)
				{
					throw new StrongTypingException("表“Log”中列“WXpay”的值为 DBNull。", innerException);
				}
			}
			set
			{
				base[tableLog.WXpayColumn] = value;
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public decimal Epay2
		{
			get
			{
				try
				{
					return (decimal)base[tableLog.Epay2Column];
				}
				catch (InvalidCastException innerException)
				{
					throw new StrongTypingException("表“Log”中列“Epay2”的值为 DBNull。", innerException);
				}
			}
			set
			{
				base[tableLog.Epay2Column] = value;
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public decimal Epay3
		{
			get
			{
				try
				{
					return (decimal)base[tableLog.Epay3Column];
				}
				catch (InvalidCastException innerException)
				{
					throw new StrongTypingException("表“Log”中列“Epay3”的值为 DBNull。", innerException);
				}
			}
			set
			{
				base[tableLog.Epay3Column] = value;
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public decimal Epay4
		{
			get
			{
				try
				{
					return (decimal)base[tableLog.Epay4Column];
				}
				catch (InvalidCastException innerException)
				{
					throw new StrongTypingException("表“Log”中列“Epay4”的值为 DBNull。", innerException);
				}
			}
			set
			{
				base[tableLog.Epay4Column] = value;
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public decimal Epay5
		{
			get
			{
				try
				{
					return (decimal)base[tableLog.Epay5Column];
				}
				catch (InvalidCastException innerException)
				{
					throw new StrongTypingException("表“Log”中列“Epay5”的值为 DBNull。", innerException);
				}
			}
			set
			{
				base[tableLog.Epay5Column] = value;
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public decimal Epay6
		{
			get
			{
				try
				{
					return (decimal)base[tableLog.Epay6Column];
				}
				catch (InvalidCastException innerException)
				{
					throw new StrongTypingException("表“Log”中列“Epay6”的值为 DBNull。", innerException);
				}
			}
			set
			{
				base[tableLog.Epay6Column] = value;
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public decimal Epay7
		{
			get
			{
				try
				{
					return (decimal)base[tableLog.Epay7Column];
				}
				catch (InvalidCastException innerException)
				{
					throw new StrongTypingException("表“Log”中列“Epay7”的值为 DBNull。", innerException);
				}
			}
			set
			{
				base[tableLog.Epay7Column] = value;
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public DeviceRow DeviceRow
		{
			get
			{
				return (DeviceRow)GetParentRow(base.Table.ParentRelations["FK_Device_Log"]);
			}
			set
			{
				SetParentRow(value, base.Table.ParentRelations["FK_Device_Log"]);
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		internal LogRow(DataRowBuilder rb)
			: base(rb)
		{
			tableLog = (LogDataTable)base.Table;
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public bool IsDateTimeNull()
		{
			return IsNull(tableLog.DateTimeColumn);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public void SetDateTimeNull()
		{
			base[tableLog.DateTimeColumn] = Convert.DBNull;
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public bool IsSIDNull()
		{
			return IsNull(tableLog.SIDColumn);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public void SetSIDNull()
		{
			base[tableLog.SIDColumn] = Convert.DBNull;
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public bool IsSalesmanNull()
		{
			return IsNull(tableLog.SalesmanColumn);
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public void SetSalesmanNull()
		{
			base[tableLog.SalesmanColumn] = Convert.DBNull;
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public bool IsDisRoundNull()
		{
			return IsNull(tableLog.DisRoundColumn);
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public void SetDisRoundNull()
		{
			base[tableLog.DisRoundColumn] = Convert.DBNull;
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public bool IsSfeeNull()
		{
			return IsNull(tableLog.SfeeColumn);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public void SetSfeeNull()
		{
			base[tableLog.SfeeColumn] = Convert.DBNull;
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public bool IsPayment_CardNull()
		{
			return IsNull(tableLog.Payment_CardColumn);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public void SetPayment_CardNull()
		{
			base[tableLog.Payment_CardColumn] = Convert.DBNull;
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public bool IsPayment_Other_1Null()
		{
			return IsNull(tableLog.Payment_Other_1Column);
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public void SetPayment_Other_1Null()
		{
			base[tableLog.Payment_Other_1Column] = Convert.DBNull;
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public bool IsPayment_Other_2Null()
		{
			return IsNull(tableLog.Payment_Other_2Column);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public void SetPayment_Other_2Null()
		{
			base[tableLog.Payment_Other_2Column] = Convert.DBNull;
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public bool IsPayment_Other_3Null()
		{
			return IsNull(tableLog.Payment_Other_3Column);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public void SetPayment_Other_3Null()
		{
			base[tableLog.Payment_Other_3Column] = Convert.DBNull;
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public bool IsPayment_TotalNull()
		{
			return IsNull(tableLog.Payment_TotalColumn);
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public void SetPayment_TotalNull()
		{
			base[tableLog.Payment_TotalColumn] = Convert.DBNull;
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public bool IsTaxNull()
		{
			return IsNull(tableLog.TaxColumn);
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public void SetTaxNull()
		{
			base[tableLog.TaxColumn] = Convert.DBNull;
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public bool IsCostNull()
		{
			return IsNull(tableLog.CostColumn);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public void SetCostNull()
		{
			base[tableLog.CostColumn] = Convert.DBNull;
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public bool IsSubNoNull()
		{
			return IsNull(tableLog.SubNoColumn);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public void SetSubNoNull()
		{
			base[tableLog.SubNoColumn] = Convert.DBNull;
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public bool IsAlipayNull()
		{
			return IsNull(tableLog.AlipayColumn);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public void SetAlipayNull()
		{
			base[tableLog.AlipayColumn] = Convert.DBNull;
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public bool IsWXpayNull()
		{
			return IsNull(tableLog.WXpayColumn);
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public void SetWXpayNull()
		{
			base[tableLog.WXpayColumn] = Convert.DBNull;
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public bool IsEpay2Null()
		{
			return IsNull(tableLog.Epay2Column);
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public void SetEpay2Null()
		{
			base[tableLog.Epay2Column] = Convert.DBNull;
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public bool IsEpay3Null()
		{
			return IsNull(tableLog.Epay3Column);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public void SetEpay3Null()
		{
			base[tableLog.Epay3Column] = Convert.DBNull;
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public bool IsEpay4Null()
		{
			return IsNull(tableLog.Epay4Column);
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public void SetEpay4Null()
		{
			base[tableLog.Epay4Column] = Convert.DBNull;
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public bool IsEpay5Null()
		{
			return IsNull(tableLog.Epay5Column);
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public void SetEpay5Null()
		{
			base[tableLog.Epay5Column] = Convert.DBNull;
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public bool IsEpay6Null()
		{
			return IsNull(tableLog.Epay6Column);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public void SetEpay6Null()
		{
			base[tableLog.Epay6Column] = Convert.DBNull;
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public bool IsEpay7Null()
		{
			return IsNull(tableLog.Epay7Column);
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public void SetEpay7Null()
		{
			base[tableLog.Epay7Column] = Convert.DBNull;
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public LogItemRow[] GetLogItemRows()
		{
			if (base.Table.ChildRelations["FK_Log_LogItem"] == null)
			{
				return new LogItemRow[0];
			}
			return (LogItemRow[])GetChildRows(base.Table.ChildRelations["FK_Log_LogItem"]);
		}
	}

	public class LogItemRow : DataRow
	{
		private LogItemDataTable tableLogItem;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public string MAC
		{
			get
			{
				return (string)base[tableLogItem.MACColumn];
			}
			set
			{
				base[tableLogItem.MACColumn] = value;
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public int FID
		{
			get
			{
				return (int)base[tableLogItem.FIDColumn];
			}
			set
			{
				base[tableLogItem.FIDColumn] = value;
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public int SubID
		{
			get
			{
				return (int)base[tableLogItem.SubIDColumn];
			}
			set
			{
				base[tableLogItem.SubIDColumn] = value;
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public decimal Price
		{
			get
			{
				try
				{
					return (decimal)base[tableLogItem.PriceColumn];
				}
				catch (InvalidCastException innerException)
				{
					throw new StrongTypingException("表“LogItem”中列“Price”的值为 DBNull。", innerException);
				}
			}
			set
			{
				base[tableLogItem.PriceColumn] = value;
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public int PLU
		{
			get
			{
				try
				{
					return (int)base[tableLogItem.PLUColumn];
				}
				catch (InvalidCastException innerException)
				{
					throw new StrongTypingException("表“LogItem”中列“PLU”的值为 DBNull。", innerException);
				}
			}
			set
			{
				base[tableLogItem.PLUColumn] = value;
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public int Class
		{
			get
			{
				try
				{
					return (int)base[tableLogItem.ClassColumn];
				}
				catch (InvalidCastException innerException)
				{
					throw new StrongTypingException("表“LogItem”中列“Class”的值为 DBNull。", innerException);
				}
			}
			set
			{
				base[tableLogItem.ClassColumn] = value;
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public int Dept
		{
			get
			{
				try
				{
					return (int)base[tableLogItem.DeptColumn];
				}
				catch (InvalidCastException innerException)
				{
					throw new StrongTypingException("表“LogItem”中列“Dept”的值为 DBNull。", innerException);
				}
			}
			set
			{
				base[tableLogItem.DeptColumn] = value;
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public decimal Cost
		{
			get
			{
				try
				{
					return (decimal)base[tableLogItem.CostColumn];
				}
				catch (InvalidCastException innerException)
				{
					throw new StrongTypingException("表“LogItem”中列“Cost”的值为 DBNull。", innerException);
				}
			}
			set
			{
				base[tableLogItem.CostColumn] = value;
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public decimal Amount
		{
			get
			{
				try
				{
					return (decimal)base[tableLogItem.AmountColumn];
				}
				catch (InvalidCastException innerException)
				{
					throw new StrongTypingException("表“LogItem”中列“Amount”的值为 DBNull。", innerException);
				}
			}
			set
			{
				base[tableLogItem.AmountColumn] = value;
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public int Unit
		{
			get
			{
				try
				{
					return (int)base[tableLogItem.UnitColumn];
				}
				catch (InvalidCastException innerException)
				{
					throw new StrongTypingException("表“LogItem”中列“Unit”的值为 DBNull。", innerException);
				}
			}
			set
			{
				base[tableLogItem.UnitColumn] = value;
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public int Type
		{
			get
			{
				try
				{
					return (int)base[tableLogItem.TypeColumn];
				}
				catch (InvalidCastException innerException)
				{
					throw new StrongTypingException("表“LogItem”中列“Type”的值为 DBNull。", innerException);
				}
			}
			set
			{
				base[tableLogItem.TypeColumn] = value;
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public decimal Tax
		{
			get
			{
				try
				{
					return (decimal)base[tableLogItem.TaxColumn];
				}
				catch (InvalidCastException innerException)
				{
					throw new StrongTypingException("表“LogItem”中列“Tax”的值为 DBNull。", innerException);
				}
			}
			set
			{
				base[tableLogItem.TaxColumn] = value;
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public string Text1
		{
			get
			{
				try
				{
					return (string)base[tableLogItem.Text1Column];
				}
				catch (InvalidCastException innerException)
				{
					throw new StrongTypingException("表“LogItem”中列“Text1”的值为 DBNull。", innerException);
				}
			}
			set
			{
				base[tableLogItem.Text1Column] = value;
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public string Text2
		{
			get
			{
				try
				{
					return (string)base[tableLogItem.Text2Column];
				}
				catch (InvalidCastException innerException)
				{
					throw new StrongTypingException("表“LogItem”中列“Text2”的值为 DBNull。", innerException);
				}
			}
			set
			{
				base[tableLogItem.Text2Column] = value;
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public string Text3
		{
			get
			{
				try
				{
					return (string)base[tableLogItem.Text3Column];
				}
				catch (InvalidCastException innerException)
				{
					throw new StrongTypingException("表“LogItem”中列“Text3”的值为 DBNull。", innerException);
				}
			}
			set
			{
				base[tableLogItem.Text3Column] = value;
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public string Text4
		{
			get
			{
				try
				{
					return (string)base[tableLogItem.Text4Column];
				}
				catch (InvalidCastException innerException)
				{
					throw new StrongTypingException("表“LogItem”中列“Text4”的值为 DBNull。", innerException);
				}
			}
			set
			{
				base[tableLogItem.Text4Column] = value;
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public decimal UnitPrice
		{
			get
			{
				try
				{
					return (decimal)base[tableLogItem.UnitPriceColumn];
				}
				catch (InvalidCastException innerException)
				{
					throw new StrongTypingException("表“LogItem”中列“UnitPrice”的值为 DBNull。", innerException);
				}
			}
			set
			{
				base[tableLogItem.UnitPriceColumn] = value;
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public int CoFID
		{
			get
			{
				try
				{
					return (int)base[tableLogItem.CoFIDColumn];
				}
				catch (InvalidCastException innerException)
				{
					throw new StrongTypingException("表“LogItem”中列“CoFID”的值为 DBNull。", innerException);
				}
			}
			set
			{
				base[tableLogItem.CoFIDColumn] = value;
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public string PLUName
		{
			get
			{
				try
				{
					return (string)base[tableLogItem.PLUNameColumn];
				}
				catch (InvalidCastException innerException)
				{
					throw new StrongTypingException("表“LogItem”中列“PLUName”的值为 DBNull。", innerException);
				}
			}
			set
			{
				base[tableLogItem.PLUNameColumn] = value;
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public DateTime DateTime
		{
			get
			{
				try
				{
					return (DateTime)base[tableLogItem.DateTimeColumn];
				}
				catch (InvalidCastException innerException)
				{
					throw new StrongTypingException("表“LogItem”中列“DateTime”的值为 DBNull。", innerException);
				}
			}
			set
			{
				base[tableLogItem.DateTimeColumn] = value;
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public LogRow LogRowParent
		{
			get
			{
				return (LogRow)GetParentRow(base.Table.ParentRelations["FK_Log_LogItem"]);
			}
			set
			{
				SetParentRow(value, base.Table.ParentRelations["FK_Log_LogItem"]);
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		internal LogItemRow(DataRowBuilder rb)
			: base(rb)
		{
			tableLogItem = (LogItemDataTable)base.Table;
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public bool IsPriceNull()
		{
			return IsNull(tableLogItem.PriceColumn);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public void SetPriceNull()
		{
			base[tableLogItem.PriceColumn] = Convert.DBNull;
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public bool IsPLUNull()
		{
			return IsNull(tableLogItem.PLUColumn);
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public void SetPLUNull()
		{
			base[tableLogItem.PLUColumn] = Convert.DBNull;
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public bool IsClassNull()
		{
			return IsNull(tableLogItem.ClassColumn);
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public void SetClassNull()
		{
			base[tableLogItem.ClassColumn] = Convert.DBNull;
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public bool IsDeptNull()
		{
			return IsNull(tableLogItem.DeptColumn);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public void SetDeptNull()
		{
			base[tableLogItem.DeptColumn] = Convert.DBNull;
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public bool IsCostNull()
		{
			return IsNull(tableLogItem.CostColumn);
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public void SetCostNull()
		{
			base[tableLogItem.CostColumn] = Convert.DBNull;
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public bool IsAmountNull()
		{
			return IsNull(tableLogItem.AmountColumn);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public void SetAmountNull()
		{
			base[tableLogItem.AmountColumn] = Convert.DBNull;
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public bool IsUnitNull()
		{
			return IsNull(tableLogItem.UnitColumn);
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public void SetUnitNull()
		{
			base[tableLogItem.UnitColumn] = Convert.DBNull;
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public bool IsTypeNull()
		{
			return IsNull(tableLogItem.TypeColumn);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public void SetTypeNull()
		{
			base[tableLogItem.TypeColumn] = Convert.DBNull;
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public bool IsTaxNull()
		{
			return IsNull(tableLogItem.TaxColumn);
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public void SetTaxNull()
		{
			base[tableLogItem.TaxColumn] = Convert.DBNull;
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public bool IsText1Null()
		{
			return IsNull(tableLogItem.Text1Column);
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public void SetText1Null()
		{
			base[tableLogItem.Text1Column] = Convert.DBNull;
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public bool IsText2Null()
		{
			return IsNull(tableLogItem.Text2Column);
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public void SetText2Null()
		{
			base[tableLogItem.Text2Column] = Convert.DBNull;
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public bool IsText3Null()
		{
			return IsNull(tableLogItem.Text3Column);
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public void SetText3Null()
		{
			base[tableLogItem.Text3Column] = Convert.DBNull;
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public bool IsText4Null()
		{
			return IsNull(tableLogItem.Text4Column);
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public void SetText4Null()
		{
			base[tableLogItem.Text4Column] = Convert.DBNull;
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public bool IsUnitPriceNull()
		{
			return IsNull(tableLogItem.UnitPriceColumn);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public void SetUnitPriceNull()
		{
			base[tableLogItem.UnitPriceColumn] = Convert.DBNull;
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public bool IsCoFIDNull()
		{
			return IsNull(tableLogItem.CoFIDColumn);
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public void SetCoFIDNull()
		{
			base[tableLogItem.CoFIDColumn] = Convert.DBNull;
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public bool IsPLUNameNull()
		{
			return IsNull(tableLogItem.PLUNameColumn);
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public void SetPLUNameNull()
		{
			base[tableLogItem.PLUNameColumn] = Convert.DBNull;
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public bool IsDateTimeNull()
		{
			return IsNull(tableLogItem.DateTimeColumn);
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public void SetDateTimeNull()
		{
			base[tableLogItem.DateTimeColumn] = Convert.DBNull;
		}
	}

	public class SGroupRow : DataRow
	{
		private SGroupDataTable tableSGroup;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public int GID
		{
			get
			{
				return (int)base[tableSGroup.GIDColumn];
			}
			set
			{
				base[tableSGroup.GIDColumn] = value;
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public string Name
		{
			get
			{
				try
				{
					return (string)base[tableSGroup.NameColumn];
				}
				catch (InvalidCastException innerException)
				{
					throw new StrongTypingException("表“SGroup”中列“Name”的值为 DBNull。", innerException);
				}
			}
			set
			{
				base[tableSGroup.NameColumn] = value;
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		internal SGroupRow(DataRowBuilder rb)
			: base(rb)
		{
			tableSGroup = (SGroupDataTable)base.Table;
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public bool IsNameNull()
		{
			return IsNull(tableSGroup.NameColumn);
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public void SetNameNull()
		{
			base[tableSGroup.NameColumn] = Convert.DBNull;
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public DeviceRow[] GetDeviceRows()
		{
			if (base.Table.ChildRelations["FK_SGroup_Device"] == null)
			{
				return new DeviceRow[0];
			}
			return (DeviceRow[])GetChildRows(base.Table.ChildRelations["FK_SGroup_Device"]);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public StockRow[] GetStockRows()
		{
			if (base.Table.ChildRelations["FK_SGroup_Stock"] == null)
			{
				return new StockRow[0];
			}
			return (StockRow[])GetChildRows(base.Table.ChildRelations["FK_SGroup_Stock"]);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public StockItemRow[] GetStockItemRows()
		{
			if (base.Table.ChildRelations["FK_SGroup_StockItem"] == null)
			{
				return new StockItemRow[0];
			}
			return (StockItemRow[])GetChildRows(base.Table.ChildRelations["FK_SGroup_StockItem"]);
		}
	}

	public class StockRow : DataRow
	{
		private StockDataTable tableStock;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public int GID
		{
			get
			{
				return (int)base[tableStock.GIDColumn];
			}
			set
			{
				base[tableStock.GIDColumn] = value;
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public int PLU
		{
			get
			{
				return (int)base[tableStock.PLUColumn];
			}
			set
			{
				base[tableStock.PLUColumn] = value;
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public DateTime STakingTime
		{
			get
			{
				try
				{
					return (DateTime)base[tableStock.STakingTimeColumn];
				}
				catch (InvalidCastException innerException)
				{
					throw new StrongTypingException("表“Stock”中列“STakingTime”的值为 DBNull。", innerException);
				}
			}
			set
			{
				base[tableStock.STakingTimeColumn] = value;
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public decimal Amount
		{
			get
			{
				try
				{
					return (decimal)base[tableStock.AmountColumn];
				}
				catch (InvalidCastException innerException)
				{
					throw new StrongTypingException("表“Stock”中列“Amount”的值为 DBNull。", innerException);
				}
			}
			set
			{
				base[tableStock.AmountColumn] = value;
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public int Unit
		{
			get
			{
				try
				{
					return (int)base[tableStock.UnitColumn];
				}
				catch (InvalidCastException innerException)
				{
					throw new StrongTypingException("表“Stock”中列“Unit”的值为 DBNull。", innerException);
				}
			}
			set
			{
				base[tableStock.UnitColumn] = value;
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public decimal In_Amount
		{
			get
			{
				try
				{
					return (decimal)base[tableStock.In_AmountColumn];
				}
				catch (InvalidCastException innerException)
				{
					throw new StrongTypingException("表“Stock”中列“In_Amount”的值为 DBNull。", innerException);
				}
			}
			set
			{
				base[tableStock.In_AmountColumn] = value;
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public decimal Spoilage
		{
			get
			{
				try
				{
					return (decimal)base[tableStock.SpoilageColumn];
				}
				catch (InvalidCastException innerException)
				{
					throw new StrongTypingException("表“Stock”中列“Spoilage”的值为 DBNull。", innerException);
				}
			}
			set
			{
				base[tableStock.SpoilageColumn] = value;
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public decimal AmountSP
		{
			get
			{
				try
				{
					return (decimal)base[tableStock.AmountSPColumn];
				}
				catch (InvalidCastException innerException)
				{
					throw new StrongTypingException("表“Stock”中列“AmountSP”的值为 DBNull。", innerException);
				}
			}
			set
			{
				base[tableStock.AmountSPColumn] = value;
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public int UnitSP
		{
			get
			{
				try
				{
					return (int)base[tableStock.UnitSPColumn];
				}
				catch (InvalidCastException innerException)
				{
					throw new StrongTypingException("表“Stock”中列“UnitSP”的值为 DBNull。", innerException);
				}
			}
			set
			{
				base[tableStock.UnitSPColumn] = value;
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public decimal In_AmountSP
		{
			get
			{
				try
				{
					return (decimal)base[tableStock.In_AmountSPColumn];
				}
				catch (InvalidCastException innerException)
				{
					throw new StrongTypingException("表“Stock”中列“In_AmountSP”的值为 DBNull。", innerException);
				}
			}
			set
			{
				base[tableStock.In_AmountSPColumn] = value;
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public decimal SpoilageSP
		{
			get
			{
				try
				{
					return (decimal)base[tableStock.SpoilageSPColumn];
				}
				catch (InvalidCastException innerException)
				{
					throw new StrongTypingException("表“Stock”中列“SpoilageSP”的值为 DBNull。", innerException);
				}
			}
			set
			{
				base[tableStock.SpoilageSPColumn] = value;
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public decimal In_Money
		{
			get
			{
				try
				{
					return (decimal)base[tableStock.In_MoneyColumn];
				}
				catch (InvalidCastException innerException)
				{
					throw new StrongTypingException("表“Stock”中列“In_Money”的值为 DBNull。", innerException);
				}
			}
			set
			{
				base[tableStock.In_MoneyColumn] = value;
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public bool Sped
		{
			get
			{
				try
				{
					return (bool)base[tableStock.SpedColumn];
				}
				catch (InvalidCastException innerException)
				{
					throw new StrongTypingException("表“Stock”中列“Sped”的值为 DBNull。", innerException);
				}
			}
			set
			{
				base[tableStock.SpedColumn] = value;
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public decimal SafetyStock
		{
			get
			{
				try
				{
					return (decimal)base[tableStock.SafetyStockColumn];
				}
				catch (InvalidCastException innerException)
				{
					throw new StrongTypingException("表“Stock”中列“SafetyStock”的值为 DBNull。", innerException);
				}
			}
			set
			{
				base[tableStock.SafetyStockColumn] = value;
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public bool LowStock
		{
			get
			{
				try
				{
					return (bool)base[tableStock.LowStockColumn];
				}
				catch (InvalidCastException innerException)
				{
					throw new StrongTypingException("表“Stock”中列“LowStock”的值为 DBNull。", innerException);
				}
			}
			set
			{
				base[tableStock.LowStockColumn] = value;
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public decimal Order
		{
			get
			{
				try
				{
					return (decimal)base[tableStock.OrderColumn];
				}
				catch (InvalidCastException innerException)
				{
					throw new StrongTypingException("表“Stock”中列“Order”的值为 DBNull。", innerException);
				}
			}
			set
			{
				base[tableStock.OrderColumn] = value;
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public int KID
		{
			get
			{
				try
				{
					return (int)base[tableStock.KIDColumn];
				}
				catch (InvalidCastException innerException)
				{
					throw new StrongTypingException("表“Stock”中列“KID”的值为 DBNull。", innerException);
				}
			}
			set
			{
				base[tableStock.KIDColumn] = value;
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public DateTime KID_Time
		{
			get
			{
				try
				{
					return (DateTime)base[tableStock.KID_TimeColumn];
				}
				catch (InvalidCastException innerException)
				{
					throw new StrongTypingException("表“Stock”中列“KID_Time”的值为 DBNull。", innerException);
				}
			}
			set
			{
				base[tableStock.KID_TimeColumn] = value;
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public SGroupRow SGroupRow
		{
			get
			{
				return (SGroupRow)GetParentRow(base.Table.ParentRelations["FK_SGroup_Stock"]);
			}
			set
			{
				SetParentRow(value, base.Table.ParentRelations["FK_SGroup_Stock"]);
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		internal StockRow(DataRowBuilder rb)
			: base(rb)
		{
			tableStock = (StockDataTable)base.Table;
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public bool IsSTakingTimeNull()
		{
			return IsNull(tableStock.STakingTimeColumn);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public void SetSTakingTimeNull()
		{
			base[tableStock.STakingTimeColumn] = Convert.DBNull;
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public bool IsAmountNull()
		{
			return IsNull(tableStock.AmountColumn);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public void SetAmountNull()
		{
			base[tableStock.AmountColumn] = Convert.DBNull;
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public bool IsUnitNull()
		{
			return IsNull(tableStock.UnitColumn);
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public void SetUnitNull()
		{
			base[tableStock.UnitColumn] = Convert.DBNull;
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public bool IsIn_AmountNull()
		{
			return IsNull(tableStock.In_AmountColumn);
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public void SetIn_AmountNull()
		{
			base[tableStock.In_AmountColumn] = Convert.DBNull;
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public bool IsSpoilageNull()
		{
			return IsNull(tableStock.SpoilageColumn);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public void SetSpoilageNull()
		{
			base[tableStock.SpoilageColumn] = Convert.DBNull;
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public bool IsAmountSPNull()
		{
			return IsNull(tableStock.AmountSPColumn);
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public void SetAmountSPNull()
		{
			base[tableStock.AmountSPColumn] = Convert.DBNull;
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public bool IsUnitSPNull()
		{
			return IsNull(tableStock.UnitSPColumn);
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public void SetUnitSPNull()
		{
			base[tableStock.UnitSPColumn] = Convert.DBNull;
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public bool IsIn_AmountSPNull()
		{
			return IsNull(tableStock.In_AmountSPColumn);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public void SetIn_AmountSPNull()
		{
			base[tableStock.In_AmountSPColumn] = Convert.DBNull;
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public bool IsSpoilageSPNull()
		{
			return IsNull(tableStock.SpoilageSPColumn);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public void SetSpoilageSPNull()
		{
			base[tableStock.SpoilageSPColumn] = Convert.DBNull;
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public bool IsIn_MoneyNull()
		{
			return IsNull(tableStock.In_MoneyColumn);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public void SetIn_MoneyNull()
		{
			base[tableStock.In_MoneyColumn] = Convert.DBNull;
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public bool IsSpedNull()
		{
			return IsNull(tableStock.SpedColumn);
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public void SetSpedNull()
		{
			base[tableStock.SpedColumn] = Convert.DBNull;
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public bool IsSafetyStockNull()
		{
			return IsNull(tableStock.SafetyStockColumn);
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public void SetSafetyStockNull()
		{
			base[tableStock.SafetyStockColumn] = Convert.DBNull;
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public bool IsLowStockNull()
		{
			return IsNull(tableStock.LowStockColumn);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public void SetLowStockNull()
		{
			base[tableStock.LowStockColumn] = Convert.DBNull;
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public bool IsOrderNull()
		{
			return IsNull(tableStock.OrderColumn);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public void SetOrderNull()
		{
			base[tableStock.OrderColumn] = Convert.DBNull;
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public bool IsKIDNull()
		{
			return IsNull(tableStock.KIDColumn);
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public void SetKIDNull()
		{
			base[tableStock.KIDColumn] = Convert.DBNull;
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public bool IsKID_TimeNull()
		{
			return IsNull(tableStock.KID_TimeColumn);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public void SetKID_TimeNull()
		{
			base[tableStock.KID_TimeColumn] = Convert.DBNull;
		}
	}

	public class StockItemRow : DataRow
	{
		private StockItemDataTable tableStockItem;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public int KID
		{
			get
			{
				return (int)base[tableStockItem.KIDColumn];
			}
			set
			{
				base[tableStockItem.KIDColumn] = value;
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public int GID
		{
			get
			{
				try
				{
					return (int)base[tableStockItem.GIDColumn];
				}
				catch (InvalidCastException innerException)
				{
					throw new StrongTypingException("表“StockItem”中列“GID”的值为 DBNull。", innerException);
				}
			}
			set
			{
				base[tableStockItem.GIDColumn] = value;
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public string MAC
		{
			get
			{
				try
				{
					return (string)base[tableStockItem.MACColumn];
				}
				catch (InvalidCastException innerException)
				{
					throw new StrongTypingException("表“StockItem”中列“MAC”的值为 DBNull。", innerException);
				}
			}
			set
			{
				base[tableStockItem.MACColumn] = value;
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public int FID
		{
			get
			{
				try
				{
					return (int)base[tableStockItem.FIDColumn];
				}
				catch (InvalidCastException innerException)
				{
					throw new StrongTypingException("表“StockItem”中列“FID”的值为 DBNull。", innerException);
				}
			}
			set
			{
				base[tableStockItem.FIDColumn] = value;
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public DateTime DateTime
		{
			get
			{
				try
				{
					return (DateTime)base[tableStockItem.DateTimeColumn];
				}
				catch (InvalidCastException innerException)
				{
					throw new StrongTypingException("表“StockItem”中列“DateTime”的值为 DBNull。", innerException);
				}
			}
			set
			{
				base[tableStockItem.DateTimeColumn] = value;
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public decimal Price
		{
			get
			{
				try
				{
					return (decimal)base[tableStockItem.PriceColumn];
				}
				catch (InvalidCastException innerException)
				{
					throw new StrongTypingException("表“StockItem”中列“Price”的值为 DBNull。", innerException);
				}
			}
			set
			{
				base[tableStockItem.PriceColumn] = value;
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public int PLU
		{
			get
			{
				try
				{
					return (int)base[tableStockItem.PLUColumn];
				}
				catch (InvalidCastException innerException)
				{
					throw new StrongTypingException("表“StockItem”中列“PLU”的值为 DBNull。", innerException);
				}
			}
			set
			{
				base[tableStockItem.PLUColumn] = value;
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public decimal Amount
		{
			get
			{
				try
				{
					return (decimal)base[tableStockItem.AmountColumn];
				}
				catch (InvalidCastException innerException)
				{
					throw new StrongTypingException("表“StockItem”中列“Amount”的值为 DBNull。", innerException);
				}
			}
			set
			{
				base[tableStockItem.AmountColumn] = value;
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public int Unit
		{
			get
			{
				try
				{
					return (int)base[tableStockItem.UnitColumn];
				}
				catch (InvalidCastException innerException)
				{
					throw new StrongTypingException("表“StockItem”中列“Unit”的值为 DBNull。", innerException);
				}
			}
			set
			{
				base[tableStockItem.UnitColumn] = value;
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public int Type
		{
			get
			{
				try
				{
					return (int)base[tableStockItem.TypeColumn];
				}
				catch (InvalidCastException innerException)
				{
					throw new StrongTypingException("表“StockItem”中列“Type”的值为 DBNull。", innerException);
				}
			}
			set
			{
				base[tableStockItem.TypeColumn] = value;
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public decimal UnitPrice
		{
			get
			{
				try
				{
					return (decimal)base[tableStockItem.UnitPriceColumn];
				}
				catch (InvalidCastException innerException)
				{
					throw new StrongTypingException("表“StockItem”中列“UnitPrice”的值为 DBNull。", innerException);
				}
			}
			set
			{
				base[tableStockItem.UnitPriceColumn] = value;
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public int SubID
		{
			get
			{
				try
				{
					return (int)base[tableStockItem.SubIDColumn];
				}
				catch (InvalidCastException innerException)
				{
					throw new StrongTypingException("表“StockItem”中列“SubID”的值为 DBNull。", innerException);
				}
			}
			set
			{
				base[tableStockItem.SubIDColumn] = value;
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public SGroupRow SGroupRow
		{
			get
			{
				return (SGroupRow)GetParentRow(base.Table.ParentRelations["FK_SGroup_StockItem"]);
			}
			set
			{
				SetParentRow(value, base.Table.ParentRelations["FK_SGroup_StockItem"]);
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		internal StockItemRow(DataRowBuilder rb)
			: base(rb)
		{
			tableStockItem = (StockItemDataTable)base.Table;
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public bool IsGIDNull()
		{
			return IsNull(tableStockItem.GIDColumn);
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public void SetGIDNull()
		{
			base[tableStockItem.GIDColumn] = Convert.DBNull;
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public bool IsMACNull()
		{
			return IsNull(tableStockItem.MACColumn);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public void SetMACNull()
		{
			base[tableStockItem.MACColumn] = Convert.DBNull;
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public bool IsFIDNull()
		{
			return IsNull(tableStockItem.FIDColumn);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public void SetFIDNull()
		{
			base[tableStockItem.FIDColumn] = Convert.DBNull;
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public bool IsDateTimeNull()
		{
			return IsNull(tableStockItem.DateTimeColumn);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public void SetDateTimeNull()
		{
			base[tableStockItem.DateTimeColumn] = Convert.DBNull;
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public bool IsPriceNull()
		{
			return IsNull(tableStockItem.PriceColumn);
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public void SetPriceNull()
		{
			base[tableStockItem.PriceColumn] = Convert.DBNull;
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public bool IsPLUNull()
		{
			return IsNull(tableStockItem.PLUColumn);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public void SetPLUNull()
		{
			base[tableStockItem.PLUColumn] = Convert.DBNull;
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public bool IsAmountNull()
		{
			return IsNull(tableStockItem.AmountColumn);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public void SetAmountNull()
		{
			base[tableStockItem.AmountColumn] = Convert.DBNull;
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public bool IsUnitNull()
		{
			return IsNull(tableStockItem.UnitColumn);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public void SetUnitNull()
		{
			base[tableStockItem.UnitColumn] = Convert.DBNull;
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public bool IsTypeNull()
		{
			return IsNull(tableStockItem.TypeColumn);
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public void SetTypeNull()
		{
			base[tableStockItem.TypeColumn] = Convert.DBNull;
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public bool IsUnitPriceNull()
		{
			return IsNull(tableStockItem.UnitPriceColumn);
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public void SetUnitPriceNull()
		{
			base[tableStockItem.UnitPriceColumn] = Convert.DBNull;
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public bool IsSubIDNull()
		{
			return IsNull(tableStockItem.SubIDColumn);
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public void SetSubIDNull()
		{
			base[tableStockItem.SubIDColumn] = Convert.DBNull;
		}
	}

	public class rPLURow : DataRow
	{
		private rPLUDataTable tablerPLU;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public int PLUID
		{
			get
			{
				return (int)base[tablerPLU.PLUIDColumn];
			}
			set
			{
				base[tablerPLU.PLUIDColumn] = value;
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public bool Valid
		{
			get
			{
				try
				{
					return (bool)base[tablerPLU.ValidColumn];
				}
				catch (InvalidCastException innerException)
				{
					throw new StrongTypingException("表“rPLU”中列“Valid”的值为 DBNull。", innerException);
				}
			}
			set
			{
				base[tablerPLU.ValidColumn] = value;
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public int Remark
		{
			get
			{
				try
				{
					return (int)base[tablerPLU.RemarkColumn];
				}
				catch (InvalidCastException innerException)
				{
					throw new StrongTypingException("表“rPLU”中列“Remark”的值为 DBNull。", innerException);
				}
			}
			set
			{
				base[tablerPLU.RemarkColumn] = value;
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public string Index
		{
			get
			{
				try
				{
					return (string)base[tablerPLU.IndexColumn];
				}
				catch (InvalidCastException innerException)
				{
					throw new StrongTypingException("表“rPLU”中列“Index”的值为 DBNull。", innerException);
				}
			}
			set
			{
				base[tablerPLU.IndexColumn] = value;
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public int UnitID
		{
			get
			{
				try
				{
					return (int)base[tablerPLU.UnitIDColumn];
				}
				catch (InvalidCastException innerException)
				{
					throw new StrongTypingException("表“rPLU”中列“UnitID”的值为 DBNull。", innerException);
				}
			}
			set
			{
				base[tablerPLU.UnitIDColumn] = value;
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public decimal Price
		{
			get
			{
				try
				{
					return (decimal)base[tablerPLU.PriceColumn];
				}
				catch (InvalidCastException innerException)
				{
					throw new StrongTypingException("表“rPLU”中列“Price”的值为 DBNull。", innerException);
				}
			}
			set
			{
				base[tablerPLU.PriceColumn] = value;
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public decimal Cost
		{
			get
			{
				try
				{
					return (decimal)base[tablerPLU.CostColumn];
				}
				catch (InvalidCastException innerException)
				{
					throw new StrongTypingException("表“rPLU”中列“Cost”的值为 DBNull。", innerException);
				}
			}
			set
			{
				base[tablerPLU.CostColumn] = value;
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public decimal Tare
		{
			get
			{
				try
				{
					return (decimal)base[tablerPLU.TareColumn];
				}
				catch (InvalidCastException innerException)
				{
					throw new StrongTypingException("表“rPLU”中列“Tare”的值为 DBNull。", innerException);
				}
			}
			set
			{
				base[tablerPLU.TareColumn] = value;
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public int BarF1
		{
			get
			{
				try
				{
					return (int)base[tablerPLU.BarF1Column];
				}
				catch (InvalidCastException innerException)
				{
					throw new StrongTypingException("表“rPLU”中列“BarF1”的值为 DBNull。", innerException);
				}
			}
			set
			{
				base[tablerPLU.BarF1Column] = value;
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public int BarF2
		{
			get
			{
				try
				{
					return (int)base[tablerPLU.BarF2Column];
				}
				catch (InvalidCastException innerException)
				{
					throw new StrongTypingException("表“rPLU”中列“BarF2”的值为 DBNull。", innerException);
				}
			}
			set
			{
				base[tablerPLU.BarF2Column] = value;
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public int BarT1
		{
			get
			{
				try
				{
					return (int)base[tablerPLU.BarT1Column];
				}
				catch (InvalidCastException innerException)
				{
					throw new StrongTypingException("表“rPLU”中列“BarT1”的值为 DBNull。", innerException);
				}
			}
			set
			{
				base[tablerPLU.BarT1Column] = value;
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public int BarT2
		{
			get
			{
				try
				{
					return (int)base[tablerPLU.BarT2Column];
				}
				catch (InvalidCastException innerException)
				{
					throw new StrongTypingException("表“rPLU”中列“BarT2”的值为 DBNull。", innerException);
				}
			}
			set
			{
				base[tablerPLU.BarT2Column] = value;
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public int LabelID1
		{
			get
			{
				try
				{
					return (int)base[tablerPLU.LabelID1Column];
				}
				catch (InvalidCastException innerException)
				{
					throw new StrongTypingException("表“rPLU”中列“LabelID1”的值为 DBNull。", innerException);
				}
			}
			set
			{
				base[tablerPLU.LabelID1Column] = value;
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public int LabelID2
		{
			get
			{
				try
				{
					return (int)base[tablerPLU.LabelID2Column];
				}
				catch (InvalidCastException innerException)
				{
					throw new StrongTypingException("表“rPLU”中列“LabelID2”的值为 DBNull。", innerException);
				}
			}
			set
			{
				base[tablerPLU.LabelID2Column] = value;
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public int ClassID
		{
			get
			{
				try
				{
					return (int)base[tablerPLU.ClassIDColumn];
				}
				catch (InvalidCastException innerException)
				{
					throw new StrongTypingException("表“rPLU”中列“ClassID”的值为 DBNull。", innerException);
				}
			}
			set
			{
				base[tablerPLU.ClassIDColumn] = value;
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public int PS_SD
		{
			get
			{
				try
				{
					return (int)base[tablerPLU.PS_SDColumn];
				}
				catch (InvalidCastException innerException)
				{
					throw new StrongTypingException("表“rPLU”中列“PS_SD”的值为 DBNull。", innerException);
				}
			}
			set
			{
				base[tablerPLU.PS_SDColumn] = value;
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public int PS_ST
		{
			get
			{
				try
				{
					return (int)base[tablerPLU.PS_STColumn];
				}
				catch (InvalidCastException innerException)
				{
					throw new StrongTypingException("表“rPLU”中列“PS_ST”的值为 DBNull。", innerException);
				}
			}
			set
			{
				base[tablerPLU.PS_STColumn] = value;
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public int PS_PD
		{
			get
			{
				try
				{
					return (int)base[tablerPLU.PS_PDColumn];
				}
				catch (InvalidCastException innerException)
				{
					throw new StrongTypingException("表“rPLU”中列“PS_PD”的值为 DBNull。", innerException);
				}
			}
			set
			{
				base[tablerPLU.PS_PDColumn] = value;
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public int PS_PT
		{
			get
			{
				try
				{
					return (int)base[tablerPLU.PS_PTColumn];
				}
				catch (InvalidCastException innerException)
				{
					throw new StrongTypingException("表“rPLU”中列“PS_PT”的值为 DBNull。", innerException);
				}
			}
			set
			{
				base[tablerPLU.PS_PTColumn] = value;
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public int PS_UD
		{
			get
			{
				try
				{
					return (int)base[tablerPLU.PS_UDColumn];
				}
				catch (InvalidCastException innerException)
				{
					throw new StrongTypingException("表“rPLU”中列“PS_UD”的值为 DBNull。", innerException);
				}
			}
			set
			{
				base[tablerPLU.PS_UDColumn] = value;
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public int PC_SD
		{
			get
			{
				try
				{
					return (int)base[tablerPLU.PC_SDColumn];
				}
				catch (InvalidCastException innerException)
				{
					throw new StrongTypingException("表“rPLU”中列“PC_SD”的值为 DBNull。", innerException);
				}
			}
			set
			{
				base[tablerPLU.PC_SDColumn] = value;
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public int PC_ST
		{
			get
			{
				try
				{
					return (int)base[tablerPLU.PC_STColumn];
				}
				catch (InvalidCastException innerException)
				{
					throw new StrongTypingException("表“rPLU”中列“PC_ST”的值为 DBNull。", innerException);
				}
			}
			set
			{
				base[tablerPLU.PC_STColumn] = value;
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public int PC_PD
		{
			get
			{
				try
				{
					return (int)base[tablerPLU.PC_PDColumn];
				}
				catch (InvalidCastException innerException)
				{
					throw new StrongTypingException("表“rPLU”中列“PC_PD”的值为 DBNull。", innerException);
				}
			}
			set
			{
				base[tablerPLU.PC_PDColumn] = value;
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public int PC_PT
		{
			get
			{
				try
				{
					return (int)base[tablerPLU.PC_PTColumn];
				}
				catch (InvalidCastException innerException)
				{
					throw new StrongTypingException("表“rPLU”中列“PC_PT”的值为 DBNull。", innerException);
				}
			}
			set
			{
				base[tablerPLU.PC_PTColumn] = value;
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public int PC_UD
		{
			get
			{
				try
				{
					return (int)base[tablerPLU.PC_UDColumn];
				}
				catch (InvalidCastException innerException)
				{
					throw new StrongTypingException("表“rPLU”中列“PC_UD”的值为 DBNull。", innerException);
				}
			}
			set
			{
				base[tablerPLU.PC_UDColumn] = value;
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public int DF_U
		{
			get
			{
				try
				{
					return (int)base[tablerPLU.DF_UColumn];
				}
				catch (InvalidCastException innerException)
				{
					throw new StrongTypingException("表“rPLU”中列“DF_U”的值为 DBNull。", innerException);
				}
			}
			set
			{
				base[tablerPLU.DF_UColumn] = value;
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public int DF_D
		{
			get
			{
				try
				{
					return (int)base[tablerPLU.DF_DColumn];
				}
				catch (InvalidCastException innerException)
				{
					throw new StrongTypingException("表“rPLU”中列“DF_D”的值为 DBNull。", innerException);
				}
			}
			set
			{
				base[tablerPLU.DF_DColumn] = value;
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public decimal DF_UN
		{
			get
			{
				try
				{
					return (decimal)base[tablerPLU.DF_UNColumn];
				}
				catch (InvalidCastException innerException)
				{
					throw new StrongTypingException("表“rPLU”中列“DF_UN”的值为 DBNull。", innerException);
				}
			}
			set
			{
				base[tablerPLU.DF_UNColumn] = value;
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public decimal DF_DN
		{
			get
			{
				try
				{
					return (decimal)base[tablerPLU.DF_DNColumn];
				}
				catch (InvalidCastException innerException)
				{
					throw new StrongTypingException("表“rPLU”中列“DF_DN”的值为 DBNull。", innerException);
				}
			}
			set
			{
				base[tablerPLU.DF_DNColumn] = value;
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public int DA_Sort1
		{
			get
			{
				try
				{
					return (int)base[tablerPLU.DA_Sort1Column];
				}
				catch (InvalidCastException innerException)
				{
					throw new StrongTypingException("表“rPLU”中列“DA_Sort1”的值为 DBNull。", innerException);
				}
			}
			set
			{
				base[tablerPLU.DA_Sort1Column] = value;
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public int DA_Day1
		{
			get
			{
				try
				{
					return (int)base[tablerPLU.DA_Day1Column];
				}
				catch (InvalidCastException innerException)
				{
					throw new StrongTypingException("表“rPLU”中列“DA_Day1”的值为 DBNull。", innerException);
				}
			}
			set
			{
				base[tablerPLU.DA_Day1Column] = value;
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public decimal DA_Up1
		{
			get
			{
				try
				{
					return (decimal)base[tablerPLU.DA_Up1Column];
				}
				catch (InvalidCastException innerException)
				{
					throw new StrongTypingException("表“rPLU”中列“DA_Up1”的值为 DBNull。", innerException);
				}
			}
			set
			{
				base[tablerPLU.DA_Up1Column] = value;
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public decimal DA_Dn1
		{
			get
			{
				try
				{
					return (decimal)base[tablerPLU.DA_Dn1Column];
				}
				catch (InvalidCastException innerException)
				{
					throw new StrongTypingException("表“rPLU”中列“DA_Dn1”的值为 DBNull。", innerException);
				}
			}
			set
			{
				base[tablerPLU.DA_Dn1Column] = value;
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public decimal DA_Num1
		{
			get
			{
				try
				{
					return (decimal)base[tablerPLU.DA_Num1Column];
				}
				catch (InvalidCastException innerException)
				{
					throw new StrongTypingException("表“rPLU”中列“DA_Num1”的值为 DBNull。", innerException);
				}
			}
			set
			{
				base[tablerPLU.DA_Num1Column] = value;
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public int DA_Sort2
		{
			get
			{
				try
				{
					return (int)base[tablerPLU.DA_Sort2Column];
				}
				catch (InvalidCastException innerException)
				{
					throw new StrongTypingException("表“rPLU”中列“DA_Sort2”的值为 DBNull。", innerException);
				}
			}
			set
			{
				base[tablerPLU.DA_Sort2Column] = value;
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public int DA_Day2
		{
			get
			{
				try
				{
					return (int)base[tablerPLU.DA_Day2Column];
				}
				catch (InvalidCastException innerException)
				{
					throw new StrongTypingException("表“rPLU”中列“DA_Day2”的值为 DBNull。", innerException);
				}
			}
			set
			{
				base[tablerPLU.DA_Day2Column] = value;
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public decimal DA_Up2
		{
			get
			{
				try
				{
					return (decimal)base[tablerPLU.DA_Up2Column];
				}
				catch (InvalidCastException innerException)
				{
					throw new StrongTypingException("表“rPLU”中列“DA_Up2”的值为 DBNull。", innerException);
				}
			}
			set
			{
				base[tablerPLU.DA_Up2Column] = value;
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public decimal DA_Dn2
		{
			get
			{
				try
				{
					return (decimal)base[tablerPLU.DA_Dn2Column];
				}
				catch (InvalidCastException innerException)
				{
					throw new StrongTypingException("表“rPLU”中列“DA_Dn2”的值为 DBNull。", innerException);
				}
			}
			set
			{
				base[tablerPLU.DA_Dn2Column] = value;
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public decimal DA_Num2
		{
			get
			{
				try
				{
					return (decimal)base[tablerPLU.DA_Num2Column];
				}
				catch (InvalidCastException innerException)
				{
					throw new StrongTypingException("表“rPLU”中列“DA_Num2”的值为 DBNull。", innerException);
				}
			}
			set
			{
				base[tablerPLU.DA_Num2Column] = value;
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public int DA_Sort3
		{
			get
			{
				try
				{
					return (int)base[tablerPLU.DA_Sort3Column];
				}
				catch (InvalidCastException innerException)
				{
					throw new StrongTypingException("表“rPLU”中列“DA_Sort3”的值为 DBNull。", innerException);
				}
			}
			set
			{
				base[tablerPLU.DA_Sort3Column] = value;
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public int DA_Day3
		{
			get
			{
				try
				{
					return (int)base[tablerPLU.DA_Day3Column];
				}
				catch (InvalidCastException innerException)
				{
					throw new StrongTypingException("表“rPLU”中列“DA_Day3”的值为 DBNull。", innerException);
				}
			}
			set
			{
				base[tablerPLU.DA_Day3Column] = value;
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public decimal DA_Up3
		{
			get
			{
				try
				{
					return (decimal)base[tablerPLU.DA_Up3Column];
				}
				catch (InvalidCastException innerException)
				{
					throw new StrongTypingException("表“rPLU”中列“DA_Up3”的值为 DBNull。", innerException);
				}
			}
			set
			{
				base[tablerPLU.DA_Up3Column] = value;
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public decimal DA_Dn3
		{
			get
			{
				try
				{
					return (decimal)base[tablerPLU.DA_Dn3Column];
				}
				catch (InvalidCastException innerException)
				{
					throw new StrongTypingException("表“rPLU”中列“DA_Dn3”的值为 DBNull。", innerException);
				}
			}
			set
			{
				base[tablerPLU.DA_Dn3Column] = value;
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public decimal DA_Num3
		{
			get
			{
				try
				{
					return (decimal)base[tablerPLU.DA_Num3Column];
				}
				catch (InvalidCastException innerException)
				{
					throw new StrongTypingException("表“rPLU”中列“DA_Num3”的值为 DBNull。", innerException);
				}
			}
			set
			{
				base[tablerPLU.DA_Num3Column] = value;
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public int DA_Sort4
		{
			get
			{
				try
				{
					return (int)base[tablerPLU.DA_Sort4Column];
				}
				catch (InvalidCastException innerException)
				{
					throw new StrongTypingException("表“rPLU”中列“DA_Sort4”的值为 DBNull。", innerException);
				}
			}
			set
			{
				base[tablerPLU.DA_Sort4Column] = value;
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public int DA_Day4
		{
			get
			{
				try
				{
					return (int)base[tablerPLU.DA_Day4Column];
				}
				catch (InvalidCastException innerException)
				{
					throw new StrongTypingException("表“rPLU”中列“DA_Day4”的值为 DBNull。", innerException);
				}
			}
			set
			{
				base[tablerPLU.DA_Day4Column] = value;
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public decimal DA_Up4
		{
			get
			{
				try
				{
					return (decimal)base[tablerPLU.DA_Up4Column];
				}
				catch (InvalidCastException innerException)
				{
					throw new StrongTypingException("表“rPLU”中列“DA_Up4”的值为 DBNull。", innerException);
				}
			}
			set
			{
				base[tablerPLU.DA_Up4Column] = value;
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public decimal DA_Dn4
		{
			get
			{
				try
				{
					return (decimal)base[tablerPLU.DA_Dn4Column];
				}
				catch (InvalidCastException innerException)
				{
					throw new StrongTypingException("表“rPLU”中列“DA_Dn4”的值为 DBNull。", innerException);
				}
			}
			set
			{
				base[tablerPLU.DA_Dn4Column] = value;
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public decimal DA_Num4
		{
			get
			{
				try
				{
					return (decimal)base[tablerPLU.DA_Num4Column];
				}
				catch (InvalidCastException innerException)
				{
					throw new StrongTypingException("表“rPLU”中列“DA_Num4”的值为 DBNull。", innerException);
				}
			}
			set
			{
				base[tablerPLU.DA_Num4Column] = value;
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public string Name
		{
			get
			{
				try
				{
					return (string)base[tablerPLU.NameColumn];
				}
				catch (InvalidCastException innerException)
				{
					throw new StrongTypingException("表“rPLU”中列“Name”的值为 DBNull。", innerException);
				}
			}
			set
			{
				base[tablerPLU.NameColumn] = value;
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public string Text1
		{
			get
			{
				try
				{
					return (string)base[tablerPLU.Text1Column];
				}
				catch (InvalidCastException innerException)
				{
					throw new StrongTypingException("表“rPLU”中列“Text1”的值为 DBNull。", innerException);
				}
			}
			set
			{
				base[tablerPLU.Text1Column] = value;
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public string Text2
		{
			get
			{
				try
				{
					return (string)base[tablerPLU.Text2Column];
				}
				catch (InvalidCastException innerException)
				{
					throw new StrongTypingException("表“rPLU”中列“Text2”的值为 DBNull。", innerException);
				}
			}
			set
			{
				base[tablerPLU.Text2Column] = value;
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public string Text3
		{
			get
			{
				try
				{
					return (string)base[tablerPLU.Text3Column];
				}
				catch (InvalidCastException innerException)
				{
					throw new StrongTypingException("表“rPLU”中列“Text3”的值为 DBNull。", innerException);
				}
			}
			set
			{
				base[tablerPLU.Text3Column] = value;
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public string Text4
		{
			get
			{
				try
				{
					return (string)base[tablerPLU.Text4Column];
				}
				catch (InvalidCastException innerException)
				{
					throw new StrongTypingException("表“rPLU”中列“Text4”的值为 DBNull。", innerException);
				}
			}
			set
			{
				base[tablerPLU.Text4Column] = value;
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public string Text5
		{
			get
			{
				try
				{
					return (string)base[tablerPLU.Text5Column];
				}
				catch (InvalidCastException innerException)
				{
					throw new StrongTypingException("表“rPLU”中列“Text5”的值为 DBNull。", innerException);
				}
			}
			set
			{
				base[tablerPLU.Text5Column] = value;
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public string Text6
		{
			get
			{
				try
				{
					return (string)base[tablerPLU.Text6Column];
				}
				catch (InvalidCastException innerException)
				{
					throw new StrongTypingException("表“rPLU”中列“Text6”的值为 DBNull。", innerException);
				}
			}
			set
			{
				base[tablerPLU.Text6Column] = value;
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public string Text7
		{
			get
			{
				try
				{
					return (string)base[tablerPLU.Text7Column];
				}
				catch (InvalidCastException innerException)
				{
					throw new StrongTypingException("表“rPLU”中列“Text7”的值为 DBNull。", innerException);
				}
			}
			set
			{
				base[tablerPLU.Text7Column] = value;
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public int TaxType
		{
			get
			{
				try
				{
					return (int)base[tablerPLU.TaxTypeColumn];
				}
				catch (InvalidCastException innerException)
				{
					throw new StrongTypingException("表“rPLU”中列“TaxType”的值为 DBNull。", innerException);
				}
			}
			set
			{
				base[tablerPLU.TaxTypeColumn] = value;
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public int Tax
		{
			get
			{
				try
				{
					return (int)base[tablerPLU.TaxColumn];
				}
				catch (InvalidCastException innerException)
				{
					throw new StrongTypingException("表“rPLU”中列“Tax”的值为 DBNull。", innerException);
				}
			}
			set
			{
				base[tablerPLU.TaxColumn] = value;
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public int SspValue1
		{
			get
			{
				try
				{
					return (int)base[tablerPLU.SspValue1Column];
				}
				catch (InvalidCastException innerException)
				{
					throw new StrongTypingException("表“rPLU”中列“SspValue1”的值为 DBNull。", innerException);
				}
			}
			set
			{
				base[tablerPLU.SspValue1Column] = value;
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public int SspValue2
		{
			get
			{
				try
				{
					return (int)base[tablerPLU.SspValue2Column];
				}
				catch (InvalidCastException innerException)
				{
					throw new StrongTypingException("表“rPLU”中列“SspValue2”的值为 DBNull。", innerException);
				}
			}
			set
			{
				base[tablerPLU.SspValue2Column] = value;
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public int SspValue3
		{
			get
			{
				try
				{
					return (int)base[tablerPLU.SspValue3Column];
				}
				catch (InvalidCastException innerException)
				{
					throw new StrongTypingException("表“rPLU”中列“SspValue3”的值为 DBNull。", innerException);
				}
			}
			set
			{
				base[tablerPLU.SspValue3Column] = value;
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public int SspValue4
		{
			get
			{
				try
				{
					return (int)base[tablerPLU.SspValue4Column];
				}
				catch (InvalidCastException innerException)
				{
					throw new StrongTypingException("表“rPLU”中列“SspValue4”的值为 DBNull。", innerException);
				}
			}
			set
			{
				base[tablerPLU.SspValue4Column] = value;
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public int SType
		{
			get
			{
				try
				{
					return (int)base[tablerPLU.STypeColumn];
				}
				catch (InvalidCastException innerException)
				{
					throw new StrongTypingException("表“rPLU”中列“SType”的值为 DBNull。", innerException);
				}
			}
			set
			{
				base[tablerPLU.STypeColumn] = value;
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		internal rPLURow(DataRowBuilder rb)
			: base(rb)
		{
			tablerPLU = (rPLUDataTable)base.Table;
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public bool IsValidNull()
		{
			return IsNull(tablerPLU.ValidColumn);
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public void SetValidNull()
		{
			base[tablerPLU.ValidColumn] = Convert.DBNull;
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public bool IsRemarkNull()
		{
			return IsNull(tablerPLU.RemarkColumn);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public void SetRemarkNull()
		{
			base[tablerPLU.RemarkColumn] = Convert.DBNull;
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public bool IsIndexNull()
		{
			return IsNull(tablerPLU.IndexColumn);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public void SetIndexNull()
		{
			base[tablerPLU.IndexColumn] = Convert.DBNull;
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public bool IsUnitIDNull()
		{
			return IsNull(tablerPLU.UnitIDColumn);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public void SetUnitIDNull()
		{
			base[tablerPLU.UnitIDColumn] = Convert.DBNull;
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public bool IsPriceNull()
		{
			return IsNull(tablerPLU.PriceColumn);
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public void SetPriceNull()
		{
			base[tablerPLU.PriceColumn] = Convert.DBNull;
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public bool IsCostNull()
		{
			return IsNull(tablerPLU.CostColumn);
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public void SetCostNull()
		{
			base[tablerPLU.CostColumn] = Convert.DBNull;
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public bool IsTareNull()
		{
			return IsNull(tablerPLU.TareColumn);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public void SetTareNull()
		{
			base[tablerPLU.TareColumn] = Convert.DBNull;
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public bool IsBarF1Null()
		{
			return IsNull(tablerPLU.BarF1Column);
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public void SetBarF1Null()
		{
			base[tablerPLU.BarF1Column] = Convert.DBNull;
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public bool IsBarF2Null()
		{
			return IsNull(tablerPLU.BarF2Column);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public void SetBarF2Null()
		{
			base[tablerPLU.BarF2Column] = Convert.DBNull;
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public bool IsBarT1Null()
		{
			return IsNull(tablerPLU.BarT1Column);
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public void SetBarT1Null()
		{
			base[tablerPLU.BarT1Column] = Convert.DBNull;
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public bool IsBarT2Null()
		{
			return IsNull(tablerPLU.BarT2Column);
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public void SetBarT2Null()
		{
			base[tablerPLU.BarT2Column] = Convert.DBNull;
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public bool IsLabelID1Null()
		{
			return IsNull(tablerPLU.LabelID1Column);
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public void SetLabelID1Null()
		{
			base[tablerPLU.LabelID1Column] = Convert.DBNull;
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public bool IsLabelID2Null()
		{
			return IsNull(tablerPLU.LabelID2Column);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public void SetLabelID2Null()
		{
			base[tablerPLU.LabelID2Column] = Convert.DBNull;
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public bool IsClassIDNull()
		{
			return IsNull(tablerPLU.ClassIDColumn);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public void SetClassIDNull()
		{
			base[tablerPLU.ClassIDColumn] = Convert.DBNull;
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public bool IsPS_SDNull()
		{
			return IsNull(tablerPLU.PS_SDColumn);
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public void SetPS_SDNull()
		{
			base[tablerPLU.PS_SDColumn] = Convert.DBNull;
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public bool IsPS_STNull()
		{
			return IsNull(tablerPLU.PS_STColumn);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public void SetPS_STNull()
		{
			base[tablerPLU.PS_STColumn] = Convert.DBNull;
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public bool IsPS_PDNull()
		{
			return IsNull(tablerPLU.PS_PDColumn);
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public void SetPS_PDNull()
		{
			base[tablerPLU.PS_PDColumn] = Convert.DBNull;
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public bool IsPS_PTNull()
		{
			return IsNull(tablerPLU.PS_PTColumn);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public void SetPS_PTNull()
		{
			base[tablerPLU.PS_PTColumn] = Convert.DBNull;
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public bool IsPS_UDNull()
		{
			return IsNull(tablerPLU.PS_UDColumn);
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public void SetPS_UDNull()
		{
			base[tablerPLU.PS_UDColumn] = Convert.DBNull;
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public bool IsPC_SDNull()
		{
			return IsNull(tablerPLU.PC_SDColumn);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public void SetPC_SDNull()
		{
			base[tablerPLU.PC_SDColumn] = Convert.DBNull;
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public bool IsPC_STNull()
		{
			return IsNull(tablerPLU.PC_STColumn);
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public void SetPC_STNull()
		{
			base[tablerPLU.PC_STColumn] = Convert.DBNull;
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public bool IsPC_PDNull()
		{
			return IsNull(tablerPLU.PC_PDColumn);
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public void SetPC_PDNull()
		{
			base[tablerPLU.PC_PDColumn] = Convert.DBNull;
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public bool IsPC_PTNull()
		{
			return IsNull(tablerPLU.PC_PTColumn);
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public void SetPC_PTNull()
		{
			base[tablerPLU.PC_PTColumn] = Convert.DBNull;
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public bool IsPC_UDNull()
		{
			return IsNull(tablerPLU.PC_UDColumn);
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public void SetPC_UDNull()
		{
			base[tablerPLU.PC_UDColumn] = Convert.DBNull;
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public bool IsDF_UNull()
		{
			return IsNull(tablerPLU.DF_UColumn);
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public void SetDF_UNull()
		{
			base[tablerPLU.DF_UColumn] = Convert.DBNull;
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public bool IsDF_DNull()
		{
			return IsNull(tablerPLU.DF_DColumn);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public void SetDF_DNull()
		{
			base[tablerPLU.DF_DColumn] = Convert.DBNull;
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public bool IsDF_UNNull()
		{
			return IsNull(tablerPLU.DF_UNColumn);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public void SetDF_UNNull()
		{
			base[tablerPLU.DF_UNColumn] = Convert.DBNull;
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public bool IsDF_DNNull()
		{
			return IsNull(tablerPLU.DF_DNColumn);
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public void SetDF_DNNull()
		{
			base[tablerPLU.DF_DNColumn] = Convert.DBNull;
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public bool IsDA_Sort1Null()
		{
			return IsNull(tablerPLU.DA_Sort1Column);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public void SetDA_Sort1Null()
		{
			base[tablerPLU.DA_Sort1Column] = Convert.DBNull;
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public bool IsDA_Day1Null()
		{
			return IsNull(tablerPLU.DA_Day1Column);
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public void SetDA_Day1Null()
		{
			base[tablerPLU.DA_Day1Column] = Convert.DBNull;
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public bool IsDA_Up1Null()
		{
			return IsNull(tablerPLU.DA_Up1Column);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public void SetDA_Up1Null()
		{
			base[tablerPLU.DA_Up1Column] = Convert.DBNull;
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public bool IsDA_Dn1Null()
		{
			return IsNull(tablerPLU.DA_Dn1Column);
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public void SetDA_Dn1Null()
		{
			base[tablerPLU.DA_Dn1Column] = Convert.DBNull;
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public bool IsDA_Num1Null()
		{
			return IsNull(tablerPLU.DA_Num1Column);
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public void SetDA_Num1Null()
		{
			base[tablerPLU.DA_Num1Column] = Convert.DBNull;
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public bool IsDA_Sort2Null()
		{
			return IsNull(tablerPLU.DA_Sort2Column);
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public void SetDA_Sort2Null()
		{
			base[tablerPLU.DA_Sort2Column] = Convert.DBNull;
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public bool IsDA_Day2Null()
		{
			return IsNull(tablerPLU.DA_Day2Column);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public void SetDA_Day2Null()
		{
			base[tablerPLU.DA_Day2Column] = Convert.DBNull;
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public bool IsDA_Up2Null()
		{
			return IsNull(tablerPLU.DA_Up2Column);
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public void SetDA_Up2Null()
		{
			base[tablerPLU.DA_Up2Column] = Convert.DBNull;
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public bool IsDA_Dn2Null()
		{
			return IsNull(tablerPLU.DA_Dn2Column);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public void SetDA_Dn2Null()
		{
			base[tablerPLU.DA_Dn2Column] = Convert.DBNull;
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public bool IsDA_Num2Null()
		{
			return IsNull(tablerPLU.DA_Num2Column);
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public void SetDA_Num2Null()
		{
			base[tablerPLU.DA_Num2Column] = Convert.DBNull;
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public bool IsDA_Sort3Null()
		{
			return IsNull(tablerPLU.DA_Sort3Column);
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public void SetDA_Sort3Null()
		{
			base[tablerPLU.DA_Sort3Column] = Convert.DBNull;
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public bool IsDA_Day3Null()
		{
			return IsNull(tablerPLU.DA_Day3Column);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public void SetDA_Day3Null()
		{
			base[tablerPLU.DA_Day3Column] = Convert.DBNull;
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public bool IsDA_Up3Null()
		{
			return IsNull(tablerPLU.DA_Up3Column);
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public void SetDA_Up3Null()
		{
			base[tablerPLU.DA_Up3Column] = Convert.DBNull;
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public bool IsDA_Dn3Null()
		{
			return IsNull(tablerPLU.DA_Dn3Column);
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public void SetDA_Dn3Null()
		{
			base[tablerPLU.DA_Dn3Column] = Convert.DBNull;
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public bool IsDA_Num3Null()
		{
			return IsNull(tablerPLU.DA_Num3Column);
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public void SetDA_Num3Null()
		{
			base[tablerPLU.DA_Num3Column] = Convert.DBNull;
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public bool IsDA_Sort4Null()
		{
			return IsNull(tablerPLU.DA_Sort4Column);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public void SetDA_Sort4Null()
		{
			base[tablerPLU.DA_Sort4Column] = Convert.DBNull;
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public bool IsDA_Day4Null()
		{
			return IsNull(tablerPLU.DA_Day4Column);
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public void SetDA_Day4Null()
		{
			base[tablerPLU.DA_Day4Column] = Convert.DBNull;
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public bool IsDA_Up4Null()
		{
			return IsNull(tablerPLU.DA_Up4Column);
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public void SetDA_Up4Null()
		{
			base[tablerPLU.DA_Up4Column] = Convert.DBNull;
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public bool IsDA_Dn4Null()
		{
			return IsNull(tablerPLU.DA_Dn4Column);
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public void SetDA_Dn4Null()
		{
			base[tablerPLU.DA_Dn4Column] = Convert.DBNull;
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public bool IsDA_Num4Null()
		{
			return IsNull(tablerPLU.DA_Num4Column);
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public void SetDA_Num4Null()
		{
			base[tablerPLU.DA_Num4Column] = Convert.DBNull;
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public bool IsNameNull()
		{
			return IsNull(tablerPLU.NameColumn);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public void SetNameNull()
		{
			base[tablerPLU.NameColumn] = Convert.DBNull;
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public bool IsText1Null()
		{
			return IsNull(tablerPLU.Text1Column);
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public void SetText1Null()
		{
			base[tablerPLU.Text1Column] = Convert.DBNull;
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public bool IsText2Null()
		{
			return IsNull(tablerPLU.Text2Column);
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public void SetText2Null()
		{
			base[tablerPLU.Text2Column] = Convert.DBNull;
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public bool IsText3Null()
		{
			return IsNull(tablerPLU.Text3Column);
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public void SetText3Null()
		{
			base[tablerPLU.Text3Column] = Convert.DBNull;
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public bool IsText4Null()
		{
			return IsNull(tablerPLU.Text4Column);
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public void SetText4Null()
		{
			base[tablerPLU.Text4Column] = Convert.DBNull;
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public bool IsText5Null()
		{
			return IsNull(tablerPLU.Text5Column);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public void SetText5Null()
		{
			base[tablerPLU.Text5Column] = Convert.DBNull;
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public bool IsText6Null()
		{
			return IsNull(tablerPLU.Text6Column);
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public void SetText6Null()
		{
			base[tablerPLU.Text6Column] = Convert.DBNull;
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public bool IsText7Null()
		{
			return IsNull(tablerPLU.Text7Column);
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public void SetText7Null()
		{
			base[tablerPLU.Text7Column] = Convert.DBNull;
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public bool IsTaxTypeNull()
		{
			return IsNull(tablerPLU.TaxTypeColumn);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public void SetTaxTypeNull()
		{
			base[tablerPLU.TaxTypeColumn] = Convert.DBNull;
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public bool IsTaxNull()
		{
			return IsNull(tablerPLU.TaxColumn);
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public void SetTaxNull()
		{
			base[tablerPLU.TaxColumn] = Convert.DBNull;
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public bool IsSspValue1Null()
		{
			return IsNull(tablerPLU.SspValue1Column);
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public void SetSspValue1Null()
		{
			base[tablerPLU.SspValue1Column] = Convert.DBNull;
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public bool IsSspValue2Null()
		{
			return IsNull(tablerPLU.SspValue2Column);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public void SetSspValue2Null()
		{
			base[tablerPLU.SspValue2Column] = Convert.DBNull;
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public bool IsSspValue3Null()
		{
			return IsNull(tablerPLU.SspValue3Column);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public void SetSspValue3Null()
		{
			base[tablerPLU.SspValue3Column] = Convert.DBNull;
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public bool IsSspValue4Null()
		{
			return IsNull(tablerPLU.SspValue4Column);
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public void SetSspValue4Null()
		{
			base[tablerPLU.SspValue4Column] = Convert.DBNull;
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public bool IsSTypeNull()
		{
			return IsNull(tablerPLU.STypeColumn);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public void SetSTypeNull()
		{
			base[tablerPLU.STypeColumn] = Convert.DBNull;
		}
	}

	public class rUnitRow : DataRow
	{
		private rUnitDataTable tablerUnit;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public int UnitID
		{
			get
			{
				return (int)base[tablerUnit.UnitIDColumn];
			}
			set
			{
				base[tablerUnit.UnitIDColumn] = value;
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public string Amount
		{
			get
			{
				try
				{
					return (string)base[tablerUnit.AmountColumn];
				}
				catch (InvalidCastException innerException)
				{
					throw new StrongTypingException("表“rUnit”中列“Amount”的值为 DBNull。", innerException);
				}
			}
			set
			{
				base[tablerUnit.AmountColumn] = value;
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public string Pamount
		{
			get
			{
				try
				{
					return (string)base[tablerUnit.PamountColumn];
				}
				catch (InvalidCastException innerException)
				{
					throw new StrongTypingException("表“rUnit”中列“Pamount”的值为 DBNull。", innerException);
				}
			}
			set
			{
				base[tablerUnit.PamountColumn] = value;
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public string Name
		{
			get
			{
				try
				{
					return (string)base[tablerUnit.NameColumn];
				}
				catch (InvalidCastException innerException)
				{
					throw new StrongTypingException("表“rUnit”中列“Name”的值为 DBNull。", innerException);
				}
			}
			set
			{
				base[tablerUnit.NameColumn] = value;
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public int Punit
		{
			get
			{
				try
				{
					return (int)base[tablerUnit.PunitColumn];
				}
				catch (InvalidCastException innerException)
				{
					throw new StrongTypingException("表“rUnit”中列“Punit”的值为 DBNull。", innerException);
				}
			}
			set
			{
				base[tablerUnit.PunitColumn] = value;
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public decimal Pack
		{
			get
			{
				try
				{
					return (decimal)base[tablerUnit.PackColumn];
				}
				catch (InvalidCastException innerException)
				{
					throw new StrongTypingException("表“rUnit”中列“Pack”的值为 DBNull。", innerException);
				}
			}
			set
			{
				base[tablerUnit.PackColumn] = value;
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public bool FlagP
		{
			get
			{
				try
				{
					return (bool)base[tablerUnit.FlagPColumn];
				}
				catch (InvalidCastException innerException)
				{
					throw new StrongTypingException("表“rUnit”中列“FlagP”的值为 DBNull。", innerException);
				}
			}
			set
			{
				base[tablerUnit.FlagPColumn] = value;
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public bool FlagA
		{
			get
			{
				try
				{
					return (bool)base[tablerUnit.FlagAColumn];
				}
				catch (InvalidCastException innerException)
				{
					throw new StrongTypingException("表“rUnit”中列“FlagA”的值为 DBNull。", innerException);
				}
			}
			set
			{
				base[tablerUnit.FlagAColumn] = value;
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		internal rUnitRow(DataRowBuilder rb)
			: base(rb)
		{
			tablerUnit = (rUnitDataTable)base.Table;
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public bool IsAmountNull()
		{
			return IsNull(tablerUnit.AmountColumn);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public void SetAmountNull()
		{
			base[tablerUnit.AmountColumn] = Convert.DBNull;
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public bool IsPamountNull()
		{
			return IsNull(tablerUnit.PamountColumn);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public void SetPamountNull()
		{
			base[tablerUnit.PamountColumn] = Convert.DBNull;
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public bool IsNameNull()
		{
			return IsNull(tablerUnit.NameColumn);
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public void SetNameNull()
		{
			base[tablerUnit.NameColumn] = Convert.DBNull;
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public bool IsPunitNull()
		{
			return IsNull(tablerUnit.PunitColumn);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public void SetPunitNull()
		{
			base[tablerUnit.PunitColumn] = Convert.DBNull;
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public bool IsPackNull()
		{
			return IsNull(tablerUnit.PackColumn);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public void SetPackNull()
		{
			base[tablerUnit.PackColumn] = Convert.DBNull;
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public bool IsFlagPNull()
		{
			return IsNull(tablerUnit.FlagPColumn);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public void SetFlagPNull()
		{
			base[tablerUnit.FlagPColumn] = Convert.DBNull;
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public bool IsFlagANull()
		{
			return IsNull(tablerUnit.FlagAColumn);
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public void SetFlagANull()
		{
			base[tablerUnit.FlagAColumn] = Convert.DBNull;
		}
	}

	public class AllLogsRow : DataRow
	{
		private AllLogsDataTable tableAllLogs;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public string MAC
		{
			get
			{
				try
				{
					return (string)base[tableAllLogs.MACColumn];
				}
				catch (InvalidCastException innerException)
				{
					throw new StrongTypingException("表“AllLogs”中列“MAC”的值为 DBNull。", innerException);
				}
			}
			set
			{
				base[tableAllLogs.MACColumn] = value;
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public string Name
		{
			get
			{
				try
				{
					return (string)base[tableAllLogs.NameColumn];
				}
				catch (InvalidCastException innerException)
				{
					throw new StrongTypingException("表“AllLogs”中列“Name”的值为 DBNull。", innerException);
				}
			}
			set
			{
				base[tableAllLogs.NameColumn] = value;
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public int FID
		{
			get
			{
				try
				{
					return (int)base[tableAllLogs.FIDColumn];
				}
				catch (InvalidCastException innerException)
				{
					throw new StrongTypingException("表“AllLogs”中列“FID”的值为 DBNull。", innerException);
				}
			}
			set
			{
				base[tableAllLogs.FIDColumn] = value;
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public DateTime DateTime
		{
			get
			{
				try
				{
					return (DateTime)base[tableAllLogs.DateTimeColumn];
				}
				catch (InvalidCastException innerException)
				{
					throw new StrongTypingException("表“AllLogs”中列“DateTime”的值为 DBNull。", innerException);
				}
			}
			set
			{
				base[tableAllLogs.DateTimeColumn] = value;
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public int SID
		{
			get
			{
				try
				{
					return (int)base[tableAllLogs.SIDColumn];
				}
				catch (InvalidCastException innerException)
				{
					throw new StrongTypingException("表“AllLogs”中列“SID”的值为 DBNull。", innerException);
				}
			}
			set
			{
				base[tableAllLogs.SIDColumn] = value;
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public int Salesman
		{
			get
			{
				try
				{
					return (int)base[tableAllLogs.SalesmanColumn];
				}
				catch (InvalidCastException innerException)
				{
					throw new StrongTypingException("表“AllLogs”中列“Salesman”的值为 DBNull。", innerException);
				}
			}
			set
			{
				base[tableAllLogs.SalesmanColumn] = value;
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public int SubID
		{
			get
			{
				try
				{
					return (int)base[tableAllLogs.SubIDColumn];
				}
				catch (InvalidCastException innerException)
				{
					throw new StrongTypingException("表“AllLogs”中列“SubID”的值为 DBNull。", innerException);
				}
			}
			set
			{
				base[tableAllLogs.SubIDColumn] = value;
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public decimal Price
		{
			get
			{
				try
				{
					return (decimal)base[tableAllLogs.PriceColumn];
				}
				catch (InvalidCastException innerException)
				{
					throw new StrongTypingException("表“AllLogs”中列“Price”的值为 DBNull。", innerException);
				}
			}
			set
			{
				base[tableAllLogs.PriceColumn] = value;
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public int PLU
		{
			get
			{
				try
				{
					return (int)base[tableAllLogs.PLUColumn];
				}
				catch (InvalidCastException innerException)
				{
					throw new StrongTypingException("表“AllLogs”中列“PLU”的值为 DBNull。", innerException);
				}
			}
			set
			{
				base[tableAllLogs.PLUColumn] = value;
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public int Class
		{
			get
			{
				try
				{
					return (int)base[tableAllLogs.ClassColumn];
				}
				catch (InvalidCastException innerException)
				{
					throw new StrongTypingException("表“AllLogs”中列“Class”的值为 DBNull。", innerException);
				}
			}
			set
			{
				base[tableAllLogs.ClassColumn] = value;
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public int Dept
		{
			get
			{
				try
				{
					return (int)base[tableAllLogs.DeptColumn];
				}
				catch (InvalidCastException innerException)
				{
					throw new StrongTypingException("表“AllLogs”中列“Dept”的值为 DBNull。", innerException);
				}
			}
			set
			{
				base[tableAllLogs.DeptColumn] = value;
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public decimal Cost
		{
			get
			{
				try
				{
					return (decimal)base[tableAllLogs.CostColumn];
				}
				catch (InvalidCastException innerException)
				{
					throw new StrongTypingException("表“AllLogs”中列“Cost”的值为 DBNull。", innerException);
				}
			}
			set
			{
				base[tableAllLogs.CostColumn] = value;
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public int Unit
		{
			get
			{
				try
				{
					return (int)base[tableAllLogs.UnitColumn];
				}
				catch (InvalidCastException innerException)
				{
					throw new StrongTypingException("表“AllLogs”中列“Unit”的值为 DBNull。", innerException);
				}
			}
			set
			{
				base[tableAllLogs.UnitColumn] = value;
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public int Type
		{
			get
			{
				try
				{
					return (int)base[tableAllLogs.TypeColumn];
				}
				catch (InvalidCastException innerException)
				{
					throw new StrongTypingException("表“AllLogs”中列“Type”的值为 DBNull。", innerException);
				}
			}
			set
			{
				base[tableAllLogs.TypeColumn] = value;
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public decimal Tax
		{
			get
			{
				try
				{
					return (decimal)base[tableAllLogs.TaxColumn];
				}
				catch (InvalidCastException innerException)
				{
					throw new StrongTypingException("表“AllLogs”中列“Tax”的值为 DBNull。", innerException);
				}
			}
			set
			{
				base[tableAllLogs.TaxColumn] = value;
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public decimal Amount
		{
			get
			{
				try
				{
					return (decimal)base[tableAllLogs.AmountColumn];
				}
				catch (InvalidCastException innerException)
				{
					throw new StrongTypingException("表“AllLogs”中列“Amount”的值为 DBNull。", innerException);
				}
			}
			set
			{
				base[tableAllLogs.AmountColumn] = value;
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public string Text1
		{
			get
			{
				try
				{
					return (string)base[tableAllLogs.Text1Column];
				}
				catch (InvalidCastException innerException)
				{
					throw new StrongTypingException("表“AllLogs”中列“Text1”的值为 DBNull。", innerException);
				}
			}
			set
			{
				base[tableAllLogs.Text1Column] = value;
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public string Text2
		{
			get
			{
				try
				{
					return (string)base[tableAllLogs.Text2Column];
				}
				catch (InvalidCastException innerException)
				{
					throw new StrongTypingException("表“AllLogs”中列“Text2”的值为 DBNull。", innerException);
				}
			}
			set
			{
				base[tableAllLogs.Text2Column] = value;
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public string Text3
		{
			get
			{
				try
				{
					return (string)base[tableAllLogs.Text3Column];
				}
				catch (InvalidCastException innerException)
				{
					throw new StrongTypingException("表“AllLogs”中列“Text3”的值为 DBNull。", innerException);
				}
			}
			set
			{
				base[tableAllLogs.Text3Column] = value;
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public string Text4
		{
			get
			{
				try
				{
					return (string)base[tableAllLogs.Text4Column];
				}
				catch (InvalidCastException innerException)
				{
					throw new StrongTypingException("表“AllLogs”中列“Text4”的值为 DBNull。", innerException);
				}
			}
			set
			{
				base[tableAllLogs.Text4Column] = value;
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public decimal UnitPrice
		{
			get
			{
				try
				{
					return (decimal)base[tableAllLogs.UnitPriceColumn];
				}
				catch (InvalidCastException innerException)
				{
					throw new StrongTypingException("表“AllLogs”中列“UnitPrice”的值为 DBNull。", innerException);
				}
			}
			set
			{
				base[tableAllLogs.UnitPriceColumn] = value;
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public int CoFID
		{
			get
			{
				try
				{
					return (int)base[tableAllLogs.CoFIDColumn];
				}
				catch (InvalidCastException innerException)
				{
					throw new StrongTypingException("表“AllLogs”中列“CoFID”的值为 DBNull。", innerException);
				}
			}
			set
			{
				base[tableAllLogs.CoFIDColumn] = value;
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public string PLUName
		{
			get
			{
				try
				{
					return (string)base[tableAllLogs.PLUNameColumn];
				}
				catch (InvalidCastException innerException)
				{
					throw new StrongTypingException("表“AllLogs”中列“PLUName”的值为 DBNull。", innerException);
				}
			}
			set
			{
				base[tableAllLogs.PLUNameColumn] = value;
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public string TypeName
		{
			get
			{
				try
				{
					return (string)base[tableAllLogs.TypeNameColumn];
				}
				catch (InvalidCastException innerException)
				{
					throw new StrongTypingException("表“AllLogs”中列“TypeName”的值为 DBNull。", innerException);
				}
			}
			set
			{
				base[tableAllLogs.TypeNameColumn] = value;
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public string UnitName
		{
			get
			{
				try
				{
					return (string)base[tableAllLogs.UnitNameColumn];
				}
				catch (InvalidCastException innerException)
				{
					throw new StrongTypingException("表“AllLogs”中列“UnitName”的值为 DBNull。", innerException);
				}
			}
			set
			{
				base[tableAllLogs.UnitNameColumn] = value;
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		internal AllLogsRow(DataRowBuilder rb)
			: base(rb)
		{
			tableAllLogs = (AllLogsDataTable)base.Table;
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public bool IsMACNull()
		{
			return IsNull(tableAllLogs.MACColumn);
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public void SetMACNull()
		{
			base[tableAllLogs.MACColumn] = Convert.DBNull;
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public bool IsNameNull()
		{
			return IsNull(tableAllLogs.NameColumn);
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public void SetNameNull()
		{
			base[tableAllLogs.NameColumn] = Convert.DBNull;
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public bool IsFIDNull()
		{
			return IsNull(tableAllLogs.FIDColumn);
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public void SetFIDNull()
		{
			base[tableAllLogs.FIDColumn] = Convert.DBNull;
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public bool IsDateTimeNull()
		{
			return IsNull(tableAllLogs.DateTimeColumn);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public void SetDateTimeNull()
		{
			base[tableAllLogs.DateTimeColumn] = Convert.DBNull;
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public bool IsSIDNull()
		{
			return IsNull(tableAllLogs.SIDColumn);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public void SetSIDNull()
		{
			base[tableAllLogs.SIDColumn] = Convert.DBNull;
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public bool IsSalesmanNull()
		{
			return IsNull(tableAllLogs.SalesmanColumn);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public void SetSalesmanNull()
		{
			base[tableAllLogs.SalesmanColumn] = Convert.DBNull;
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public bool IsSubIDNull()
		{
			return IsNull(tableAllLogs.SubIDColumn);
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public void SetSubIDNull()
		{
			base[tableAllLogs.SubIDColumn] = Convert.DBNull;
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public bool IsPriceNull()
		{
			return IsNull(tableAllLogs.PriceColumn);
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public void SetPriceNull()
		{
			base[tableAllLogs.PriceColumn] = Convert.DBNull;
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public bool IsPLUNull()
		{
			return IsNull(tableAllLogs.PLUColumn);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public void SetPLUNull()
		{
			base[tableAllLogs.PLUColumn] = Convert.DBNull;
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public bool IsClassNull()
		{
			return IsNull(tableAllLogs.ClassColumn);
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public void SetClassNull()
		{
			base[tableAllLogs.ClassColumn] = Convert.DBNull;
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public bool IsDeptNull()
		{
			return IsNull(tableAllLogs.DeptColumn);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public void SetDeptNull()
		{
			base[tableAllLogs.DeptColumn] = Convert.DBNull;
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public bool IsCostNull()
		{
			return IsNull(tableAllLogs.CostColumn);
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public void SetCostNull()
		{
			base[tableAllLogs.CostColumn] = Convert.DBNull;
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public bool IsUnitNull()
		{
			return IsNull(tableAllLogs.UnitColumn);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public void SetUnitNull()
		{
			base[tableAllLogs.UnitColumn] = Convert.DBNull;
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public bool IsTypeNull()
		{
			return IsNull(tableAllLogs.TypeColumn);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public void SetTypeNull()
		{
			base[tableAllLogs.TypeColumn] = Convert.DBNull;
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public bool IsTaxNull()
		{
			return IsNull(tableAllLogs.TaxColumn);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public void SetTaxNull()
		{
			base[tableAllLogs.TaxColumn] = Convert.DBNull;
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public bool IsAmountNull()
		{
			return IsNull(tableAllLogs.AmountColumn);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public void SetAmountNull()
		{
			base[tableAllLogs.AmountColumn] = Convert.DBNull;
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public bool IsText1Null()
		{
			return IsNull(tableAllLogs.Text1Column);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public void SetText1Null()
		{
			base[tableAllLogs.Text1Column] = Convert.DBNull;
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public bool IsText2Null()
		{
			return IsNull(tableAllLogs.Text2Column);
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public void SetText2Null()
		{
			base[tableAllLogs.Text2Column] = Convert.DBNull;
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public bool IsText3Null()
		{
			return IsNull(tableAllLogs.Text3Column);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public void SetText3Null()
		{
			base[tableAllLogs.Text3Column] = Convert.DBNull;
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public bool IsText4Null()
		{
			return IsNull(tableAllLogs.Text4Column);
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public void SetText4Null()
		{
			base[tableAllLogs.Text4Column] = Convert.DBNull;
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public bool IsUnitPriceNull()
		{
			return IsNull(tableAllLogs.UnitPriceColumn);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public void SetUnitPriceNull()
		{
			base[tableAllLogs.UnitPriceColumn] = Convert.DBNull;
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public bool IsCoFIDNull()
		{
			return IsNull(tableAllLogs.CoFIDColumn);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public void SetCoFIDNull()
		{
			base[tableAllLogs.CoFIDColumn] = Convert.DBNull;
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public bool IsPLUNameNull()
		{
			return IsNull(tableAllLogs.PLUNameColumn);
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public void SetPLUNameNull()
		{
			base[tableAllLogs.PLUNameColumn] = Convert.DBNull;
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public bool IsTypeNameNull()
		{
			return IsNull(tableAllLogs.TypeNameColumn);
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public void SetTypeNameNull()
		{
			base[tableAllLogs.TypeNameColumn] = Convert.DBNull;
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public bool IsUnitNameNull()
		{
			return IsNull(tableAllLogs.UnitNameColumn);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public void SetUnitNameNull()
		{
			base[tableAllLogs.UnitNameColumn] = Convert.DBNull;
		}
	}

	public class AllStocksRow : DataRow
	{
		private AllStocksDataTable tableAllStocks;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public int KID
		{
			get
			{
				try
				{
					return (int)base[tableAllStocks.KIDColumn];
				}
				catch (InvalidCastException innerException)
				{
					throw new StrongTypingException("表“AllStocks”中列“KID”的值为 DBNull。", innerException);
				}
			}
			set
			{
				base[tableAllStocks.KIDColumn] = value;
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public string Name
		{
			get
			{
				try
				{
					return (string)base[tableAllStocks.NameColumn];
				}
				catch (InvalidCastException innerException)
				{
					throw new StrongTypingException("表“AllStocks”中列“Name”的值为 DBNull。", innerException);
				}
			}
			set
			{
				base[tableAllStocks.NameColumn] = value;
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public int PLU
		{
			get
			{
				try
				{
					return (int)base[tableAllStocks.PLUColumn];
				}
				catch (InvalidCastException innerException)
				{
					throw new StrongTypingException("表“AllStocks”中列“PLU”的值为 DBNull。", innerException);
				}
			}
			set
			{
				base[tableAllStocks.PLUColumn] = value;
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public string PLUName
		{
			get
			{
				try
				{
					return (string)base[tableAllStocks.PLUNameColumn];
				}
				catch (InvalidCastException innerException)
				{
					throw new StrongTypingException("表“AllStocks”中列“PLUName”的值为 DBNull。", innerException);
				}
			}
			set
			{
				base[tableAllStocks.PLUNameColumn] = value;
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public int Unit
		{
			get
			{
				try
				{
					return (int)base[tableAllStocks.UnitColumn];
				}
				catch (InvalidCastException innerException)
				{
					throw new StrongTypingException("表“AllStocks”中列“Unit”的值为 DBNull。", innerException);
				}
			}
			set
			{
				base[tableAllStocks.UnitColumn] = value;
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public decimal Amount
		{
			get
			{
				try
				{
					return (decimal)base[tableAllStocks.AmountColumn];
				}
				catch (InvalidCastException innerException)
				{
					throw new StrongTypingException("表“AllStocks”中列“Amount”的值为 DBNull。", innerException);
				}
			}
			set
			{
				base[tableAllStocks.AmountColumn] = value;
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public DateTime STakingTime
		{
			get
			{
				try
				{
					return (DateTime)base[tableAllStocks.STakingTimeColumn];
				}
				catch (InvalidCastException innerException)
				{
					throw new StrongTypingException("表“AllStocks”中列“STakingTime”的值为 DBNull。", innerException);
				}
			}
			set
			{
				base[tableAllStocks.STakingTimeColumn] = value;
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public decimal Spoilage
		{
			get
			{
				try
				{
					return (decimal)base[tableAllStocks.SpoilageColumn];
				}
				catch (InvalidCastException innerException)
				{
					throw new StrongTypingException("表“AllStocks”中列“Spoilage”的值为 DBNull。", innerException);
				}
			}
			set
			{
				base[tableAllStocks.SpoilageColumn] = value;
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public decimal In_Amount
		{
			get
			{
				try
				{
					return (decimal)base[tableAllStocks.In_AmountColumn];
				}
				catch (InvalidCastException innerException)
				{
					throw new StrongTypingException("表“AllStocks”中列“In_Amount”的值为 DBNull。", innerException);
				}
			}
			set
			{
				base[tableAllStocks.In_AmountColumn] = value;
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public int GID
		{
			get
			{
				try
				{
					return (int)base[tableAllStocks.GIDColumn];
				}
				catch (InvalidCastException innerException)
				{
					throw new StrongTypingException("表“AllStocks”中列“GID”的值为 DBNull。", innerException);
				}
			}
			set
			{
				base[tableAllStocks.GIDColumn] = value;
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public decimal In_Money
		{
			get
			{
				try
				{
					return (decimal)base[tableAllStocks.In_MoneyColumn];
				}
				catch (InvalidCastException innerException)
				{
					throw new StrongTypingException("表“AllStocks”中列“In_Money”的值为 DBNull。", innerException);
				}
			}
			set
			{
				base[tableAllStocks.In_MoneyColumn] = value;
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public decimal SafetyStock
		{
			get
			{
				try
				{
					return (decimal)base[tableAllStocks.SafetyStockColumn];
				}
				catch (InvalidCastException innerException)
				{
					throw new StrongTypingException("表“AllStocks”中列“SafetyStock”的值为 DBNull。", innerException);
				}
			}
			set
			{
				base[tableAllStocks.SafetyStockColumn] = value;
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public bool LowStock
		{
			get
			{
				try
				{
					return (bool)base[tableAllStocks.LowStockColumn];
				}
				catch (InvalidCastException innerException)
				{
					throw new StrongTypingException("表“AllStocks”中列“LowStock”的值为 DBNull。", innerException);
				}
			}
			set
			{
				base[tableAllStocks.LowStockColumn] = value;
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public decimal Order
		{
			get
			{
				try
				{
					return (decimal)base[tableAllStocks.OrderColumn];
				}
				catch (InvalidCastException innerException)
				{
					throw new StrongTypingException("表“AllStocks”中列“Order”的值为 DBNull。", innerException);
				}
			}
			set
			{
				base[tableAllStocks.OrderColumn] = value;
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public string UnitName
		{
			get
			{
				try
				{
					return (string)base[tableAllStocks.UnitNameColumn];
				}
				catch (InvalidCastException innerException)
				{
					throw new StrongTypingException("表“AllStocks”中列“UnitName”的值为 DBNull。", innerException);
				}
			}
			set
			{
				base[tableAllStocks.UnitNameColumn] = value;
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public DateTime KID_Time
		{
			get
			{
				try
				{
					return (DateTime)base[tableAllStocks.KID_TimeColumn];
				}
				catch (InvalidCastException innerException)
				{
					throw new StrongTypingException("表“AllStocks”中列“KID_Time”的值为 DBNull。", innerException);
				}
			}
			set
			{
				base[tableAllStocks.KID_TimeColumn] = value;
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		internal AllStocksRow(DataRowBuilder rb)
			: base(rb)
		{
			tableAllStocks = (AllStocksDataTable)base.Table;
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public bool IsKIDNull()
		{
			return IsNull(tableAllStocks.KIDColumn);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public void SetKIDNull()
		{
			base[tableAllStocks.KIDColumn] = Convert.DBNull;
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public bool IsNameNull()
		{
			return IsNull(tableAllStocks.NameColumn);
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public void SetNameNull()
		{
			base[tableAllStocks.NameColumn] = Convert.DBNull;
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public bool IsPLUNull()
		{
			return IsNull(tableAllStocks.PLUColumn);
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public void SetPLUNull()
		{
			base[tableAllStocks.PLUColumn] = Convert.DBNull;
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public bool IsPLUNameNull()
		{
			return IsNull(tableAllStocks.PLUNameColumn);
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public void SetPLUNameNull()
		{
			base[tableAllStocks.PLUNameColumn] = Convert.DBNull;
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public bool IsUnitNull()
		{
			return IsNull(tableAllStocks.UnitColumn);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public void SetUnitNull()
		{
			base[tableAllStocks.UnitColumn] = Convert.DBNull;
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public bool IsAmountNull()
		{
			return IsNull(tableAllStocks.AmountColumn);
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public void SetAmountNull()
		{
			base[tableAllStocks.AmountColumn] = Convert.DBNull;
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public bool IsSTakingTimeNull()
		{
			return IsNull(tableAllStocks.STakingTimeColumn);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public void SetSTakingTimeNull()
		{
			base[tableAllStocks.STakingTimeColumn] = Convert.DBNull;
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public bool IsSpoilageNull()
		{
			return IsNull(tableAllStocks.SpoilageColumn);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public void SetSpoilageNull()
		{
			base[tableAllStocks.SpoilageColumn] = Convert.DBNull;
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public bool IsIn_AmountNull()
		{
			return IsNull(tableAllStocks.In_AmountColumn);
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public void SetIn_AmountNull()
		{
			base[tableAllStocks.In_AmountColumn] = Convert.DBNull;
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public bool IsGIDNull()
		{
			return IsNull(tableAllStocks.GIDColumn);
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public void SetGIDNull()
		{
			base[tableAllStocks.GIDColumn] = Convert.DBNull;
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public bool IsIn_MoneyNull()
		{
			return IsNull(tableAllStocks.In_MoneyColumn);
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public void SetIn_MoneyNull()
		{
			base[tableAllStocks.In_MoneyColumn] = Convert.DBNull;
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public bool IsSafetyStockNull()
		{
			return IsNull(tableAllStocks.SafetyStockColumn);
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public void SetSafetyStockNull()
		{
			base[tableAllStocks.SafetyStockColumn] = Convert.DBNull;
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public bool IsLowStockNull()
		{
			return IsNull(tableAllStocks.LowStockColumn);
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public void SetLowStockNull()
		{
			base[tableAllStocks.LowStockColumn] = Convert.DBNull;
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public bool IsOrderNull()
		{
			return IsNull(tableAllStocks.OrderColumn);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public void SetOrderNull()
		{
			base[tableAllStocks.OrderColumn] = Convert.DBNull;
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public bool IsUnitNameNull()
		{
			return IsNull(tableAllStocks.UnitNameColumn);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public void SetUnitNameNull()
		{
			base[tableAllStocks.UnitNameColumn] = Convert.DBNull;
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public bool IsKID_TimeNull()
		{
			return IsNull(tableAllStocks.KID_TimeColumn);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public void SetKID_TimeNull()
		{
			base[tableAllStocks.KID_TimeColumn] = Convert.DBNull;
		}
	}

	public class rLogsTypeRow : DataRow
	{
		private rLogsTypeDataTable tablerLogsType;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public int TypeID
		{
			get
			{
				return (int)base[tablerLogsType.TypeIDColumn];
			}
			set
			{
				base[tablerLogsType.TypeIDColumn] = value;
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public string Name
		{
			get
			{
				try
				{
					return (string)base[tablerLogsType.NameColumn];
				}
				catch (InvalidCastException innerException)
				{
					throw new StrongTypingException("表“rLogsType”中列“Name”的值为 DBNull。", innerException);
				}
			}
			set
			{
				base[tablerLogsType.NameColumn] = value;
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		internal rLogsTypeRow(DataRowBuilder rb)
			: base(rb)
		{
			tablerLogsType = (rLogsTypeDataTable)base.Table;
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public bool IsNameNull()
		{
			return IsNull(tablerLogsType.NameColumn);
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public void SetNameNull()
		{
			base[tablerLogsType.NameColumn] = Convert.DBNull;
		}
	}

	public class rStockTypeRow : DataRow
	{
		private rStockTypeDataTable tablerStockType;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public int TypeID
		{
			get
			{
				return (int)base[tablerStockType.TypeIDColumn];
			}
			set
			{
				base[tablerStockType.TypeIDColumn] = value;
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public string Name
		{
			get
			{
				try
				{
					return (string)base[tablerStockType.NameColumn];
				}
				catch (InvalidCastException innerException)
				{
					throw new StrongTypingException("表“rStockType”中列“Name”的值为 DBNull。", innerException);
				}
			}
			set
			{
				base[tablerStockType.NameColumn] = value;
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		internal rStockTypeRow(DataRowBuilder rb)
			: base(rb)
		{
			tablerStockType = (rStockTypeDataTable)base.Table;
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public bool IsNameNull()
		{
			return IsNull(tablerStockType.NameColumn);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public void SetNameNull()
		{
			base[tablerStockType.NameColumn] = Convert.DBNull;
		}
	}

	public class ResultLogRow : DataRow
	{
		private ResultLogDataTable tableResultLog;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public string MAC
		{
			get
			{
				try
				{
					return (string)base[tableResultLog.MACColumn];
				}
				catch (InvalidCastException innerException)
				{
					throw new StrongTypingException("表“ResultLog”中列“MAC”的值为 DBNull。", innerException);
				}
			}
			set
			{
				base[tableResultLog.MACColumn] = value;
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public string Name
		{
			get
			{
				try
				{
					return (string)base[tableResultLog.NameColumn];
				}
				catch (InvalidCastException innerException)
				{
					throw new StrongTypingException("表“ResultLog”中列“Name”的值为 DBNull。", innerException);
				}
			}
			set
			{
				base[tableResultLog.NameColumn] = value;
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public int FID
		{
			get
			{
				try
				{
					return (int)base[tableResultLog.FIDColumn];
				}
				catch (InvalidCastException innerException)
				{
					throw new StrongTypingException("表“ResultLog”中列“FID”的值为 DBNull。", innerException);
				}
			}
			set
			{
				base[tableResultLog.FIDColumn] = value;
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public DateTime DateTime
		{
			get
			{
				try
				{
					return (DateTime)base[tableResultLog.DateTimeColumn];
				}
				catch (InvalidCastException innerException)
				{
					throw new StrongTypingException("表“ResultLog”中列“DateTime”的值为 DBNull。", innerException);
				}
			}
			set
			{
				base[tableResultLog.DateTimeColumn] = value;
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public int SID
		{
			get
			{
				try
				{
					return (int)base[tableResultLog.SIDColumn];
				}
				catch (InvalidCastException innerException)
				{
					throw new StrongTypingException("表“ResultLog”中列“SID”的值为 DBNull。", innerException);
				}
			}
			set
			{
				base[tableResultLog.SIDColumn] = value;
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public int Salesman
		{
			get
			{
				try
				{
					return (int)base[tableResultLog.SalesmanColumn];
				}
				catch (InvalidCastException innerException)
				{
					throw new StrongTypingException("表“ResultLog”中列“Salesman”的值为 DBNull。", innerException);
				}
			}
			set
			{
				base[tableResultLog.SalesmanColumn] = value;
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public decimal Cost
		{
			get
			{
				try
				{
					return (decimal)base[tableResultLog.CostColumn];
				}
				catch (InvalidCastException innerException)
				{
					throw new StrongTypingException("表“ResultLog”中列“Cost”的值为 DBNull。", innerException);
				}
			}
			set
			{
				base[tableResultLog.CostColumn] = value;
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public decimal Tax
		{
			get
			{
				try
				{
					return (decimal)base[tableResultLog.TaxColumn];
				}
				catch (InvalidCastException innerException)
				{
					throw new StrongTypingException("表“ResultLog”中列“Tax”的值为 DBNull。", innerException);
				}
			}
			set
			{
				base[tableResultLog.TaxColumn] = value;
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public decimal DisRound
		{
			get
			{
				try
				{
					return (decimal)base[tableResultLog.DisRoundColumn];
				}
				catch (InvalidCastException innerException)
				{
					throw new StrongTypingException("表“ResultLog”中列“DisRound”的值为 DBNull。", innerException);
				}
			}
			set
			{
				base[tableResultLog.DisRoundColumn] = value;
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public decimal Sfee
		{
			get
			{
				try
				{
					return (decimal)base[tableResultLog.SfeeColumn];
				}
				catch (InvalidCastException innerException)
				{
					throw new StrongTypingException("表“ResultLog”中列“Sfee”的值为 DBNull。", innerException);
				}
			}
			set
			{
				base[tableResultLog.SfeeColumn] = value;
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public decimal Payment_Card
		{
			get
			{
				try
				{
					return (decimal)base[tableResultLog.Payment_CardColumn];
				}
				catch (InvalidCastException innerException)
				{
					throw new StrongTypingException("表“ResultLog”中列“Payment_Card”的值为 DBNull。", innerException);
				}
			}
			set
			{
				base[tableResultLog.Payment_CardColumn] = value;
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public decimal Payment_Other_1
		{
			get
			{
				try
				{
					return (decimal)base[tableResultLog.Payment_Other_1Column];
				}
				catch (InvalidCastException innerException)
				{
					throw new StrongTypingException("表“ResultLog”中列“Payment_Other_1”的值为 DBNull。", innerException);
				}
			}
			set
			{
				base[tableResultLog.Payment_Other_1Column] = value;
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public decimal Payment_Other_2
		{
			get
			{
				try
				{
					return (decimal)base[tableResultLog.Payment_Other_2Column];
				}
				catch (InvalidCastException innerException)
				{
					throw new StrongTypingException("表“ResultLog”中列“Payment_Other_2”的值为 DBNull。", innerException);
				}
			}
			set
			{
				base[tableResultLog.Payment_Other_2Column] = value;
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public decimal Payment_Other_3
		{
			get
			{
				try
				{
					return (decimal)base[tableResultLog.Payment_Other_3Column];
				}
				catch (InvalidCastException innerException)
				{
					throw new StrongTypingException("表“ResultLog”中列“Payment_Other_3”的值为 DBNull。", innerException);
				}
			}
			set
			{
				base[tableResultLog.Payment_Other_3Column] = value;
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public decimal Payment_Total
		{
			get
			{
				try
				{
					return (decimal)base[tableResultLog.Payment_TotalColumn];
				}
				catch (InvalidCastException innerException)
				{
					throw new StrongTypingException("表“ResultLog”中列“Payment_Total”的值为 DBNull。", innerException);
				}
			}
			set
			{
				base[tableResultLog.Payment_TotalColumn] = value;
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public int SubNo
		{
			get
			{
				try
				{
					return (int)base[tableResultLog.SubNoColumn];
				}
				catch (InvalidCastException innerException)
				{
					throw new StrongTypingException("表“ResultLog”中列“SubNo”的值为 DBNull。", innerException);
				}
			}
			set
			{
				base[tableResultLog.SubNoColumn] = value;
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public decimal Alipay
		{
			get
			{
				try
				{
					return (decimal)base[tableResultLog.AlipayColumn];
				}
				catch (InvalidCastException innerException)
				{
					throw new StrongTypingException("表“ResultLog”中列“Alipay”的值为 DBNull。", innerException);
				}
			}
			set
			{
				base[tableResultLog.AlipayColumn] = value;
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public decimal WXpay
		{
			get
			{
				try
				{
					return (decimal)base[tableResultLog.WXpayColumn];
				}
				catch (InvalidCastException innerException)
				{
					throw new StrongTypingException("表“ResultLog”中列“WXpay”的值为 DBNull。", innerException);
				}
			}
			set
			{
				base[tableResultLog.WXpayColumn] = value;
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public decimal Epay2
		{
			get
			{
				try
				{
					return (decimal)base[tableResultLog.Epay2Column];
				}
				catch (InvalidCastException innerException)
				{
					throw new StrongTypingException("表“ResultLog”中列“Epay2”的值为 DBNull。", innerException);
				}
			}
			set
			{
				base[tableResultLog.Epay2Column] = value;
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public decimal Epay3
		{
			get
			{
				try
				{
					return (decimal)base[tableResultLog.Epay3Column];
				}
				catch (InvalidCastException innerException)
				{
					throw new StrongTypingException("表“ResultLog”中列“Epay3”的值为 DBNull。", innerException);
				}
			}
			set
			{
				base[tableResultLog.Epay3Column] = value;
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public decimal Epay4
		{
			get
			{
				try
				{
					return (decimal)base[tableResultLog.Epay4Column];
				}
				catch (InvalidCastException innerException)
				{
					throw new StrongTypingException("表“ResultLog”中列“Epay4”的值为 DBNull。", innerException);
				}
			}
			set
			{
				base[tableResultLog.Epay4Column] = value;
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public decimal Epay5
		{
			get
			{
				try
				{
					return (decimal)base[tableResultLog.Epay5Column];
				}
				catch (InvalidCastException innerException)
				{
					throw new StrongTypingException("表“ResultLog”中列“Epay5”的值为 DBNull。", innerException);
				}
			}
			set
			{
				base[tableResultLog.Epay5Column] = value;
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public decimal Epay6
		{
			get
			{
				try
				{
					return (decimal)base[tableResultLog.Epay6Column];
				}
				catch (InvalidCastException innerException)
				{
					throw new StrongTypingException("表“ResultLog”中列“Epay6”的值为 DBNull。", innerException);
				}
			}
			set
			{
				base[tableResultLog.Epay6Column] = value;
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public decimal Epay7
		{
			get
			{
				try
				{
					return (decimal)base[tableResultLog.Epay7Column];
				}
				catch (InvalidCastException innerException)
				{
					throw new StrongTypingException("表“ResultLog”中列“Epay7”的值为 DBNull。", innerException);
				}
			}
			set
			{
				base[tableResultLog.Epay7Column] = value;
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		internal ResultLogRow(DataRowBuilder rb)
			: base(rb)
		{
			tableResultLog = (ResultLogDataTable)base.Table;
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public bool IsMACNull()
		{
			return IsNull(tableResultLog.MACColumn);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public void SetMACNull()
		{
			base[tableResultLog.MACColumn] = Convert.DBNull;
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public bool IsNameNull()
		{
			return IsNull(tableResultLog.NameColumn);
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public void SetNameNull()
		{
			base[tableResultLog.NameColumn] = Convert.DBNull;
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public bool IsFIDNull()
		{
			return IsNull(tableResultLog.FIDColumn);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public void SetFIDNull()
		{
			base[tableResultLog.FIDColumn] = Convert.DBNull;
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public bool IsDateTimeNull()
		{
			return IsNull(tableResultLog.DateTimeColumn);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public void SetDateTimeNull()
		{
			base[tableResultLog.DateTimeColumn] = Convert.DBNull;
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public bool IsSIDNull()
		{
			return IsNull(tableResultLog.SIDColumn);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public void SetSIDNull()
		{
			base[tableResultLog.SIDColumn] = Convert.DBNull;
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public bool IsSalesmanNull()
		{
			return IsNull(tableResultLog.SalesmanColumn);
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public void SetSalesmanNull()
		{
			base[tableResultLog.SalesmanColumn] = Convert.DBNull;
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public bool IsCostNull()
		{
			return IsNull(tableResultLog.CostColumn);
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public void SetCostNull()
		{
			base[tableResultLog.CostColumn] = Convert.DBNull;
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public bool IsTaxNull()
		{
			return IsNull(tableResultLog.TaxColumn);
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public void SetTaxNull()
		{
			base[tableResultLog.TaxColumn] = Convert.DBNull;
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public bool IsDisRoundNull()
		{
			return IsNull(tableResultLog.DisRoundColumn);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public void SetDisRoundNull()
		{
			base[tableResultLog.DisRoundColumn] = Convert.DBNull;
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public bool IsSfeeNull()
		{
			return IsNull(tableResultLog.SfeeColumn);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public void SetSfeeNull()
		{
			base[tableResultLog.SfeeColumn] = Convert.DBNull;
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public bool IsPayment_CardNull()
		{
			return IsNull(tableResultLog.Payment_CardColumn);
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public void SetPayment_CardNull()
		{
			base[tableResultLog.Payment_CardColumn] = Convert.DBNull;
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public bool IsPayment_Other_1Null()
		{
			return IsNull(tableResultLog.Payment_Other_1Column);
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public void SetPayment_Other_1Null()
		{
			base[tableResultLog.Payment_Other_1Column] = Convert.DBNull;
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public bool IsPayment_Other_2Null()
		{
			return IsNull(tableResultLog.Payment_Other_2Column);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public void SetPayment_Other_2Null()
		{
			base[tableResultLog.Payment_Other_2Column] = Convert.DBNull;
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public bool IsPayment_Other_3Null()
		{
			return IsNull(tableResultLog.Payment_Other_3Column);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public void SetPayment_Other_3Null()
		{
			base[tableResultLog.Payment_Other_3Column] = Convert.DBNull;
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public bool IsPayment_TotalNull()
		{
			return IsNull(tableResultLog.Payment_TotalColumn);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public void SetPayment_TotalNull()
		{
			base[tableResultLog.Payment_TotalColumn] = Convert.DBNull;
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public bool IsSubNoNull()
		{
			return IsNull(tableResultLog.SubNoColumn);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public void SetSubNoNull()
		{
			base[tableResultLog.SubNoColumn] = Convert.DBNull;
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public bool IsAlipayNull()
		{
			return IsNull(tableResultLog.AlipayColumn);
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public void SetAlipayNull()
		{
			base[tableResultLog.AlipayColumn] = Convert.DBNull;
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public bool IsWXpayNull()
		{
			return IsNull(tableResultLog.WXpayColumn);
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public void SetWXpayNull()
		{
			base[tableResultLog.WXpayColumn] = Convert.DBNull;
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public bool IsEpay2Null()
		{
			return IsNull(tableResultLog.Epay2Column);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public void SetEpay2Null()
		{
			base[tableResultLog.Epay2Column] = Convert.DBNull;
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public bool IsEpay3Null()
		{
			return IsNull(tableResultLog.Epay3Column);
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public void SetEpay3Null()
		{
			base[tableResultLog.Epay3Column] = Convert.DBNull;
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public bool IsEpay4Null()
		{
			return IsNull(tableResultLog.Epay4Column);
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public void SetEpay4Null()
		{
			base[tableResultLog.Epay4Column] = Convert.DBNull;
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public bool IsEpay5Null()
		{
			return IsNull(tableResultLog.Epay5Column);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public void SetEpay5Null()
		{
			base[tableResultLog.Epay5Column] = Convert.DBNull;
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public bool IsEpay6Null()
		{
			return IsNull(tableResultLog.Epay6Column);
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public void SetEpay6Null()
		{
			base[tableResultLog.Epay6Column] = Convert.DBNull;
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public bool IsEpay7Null()
		{
			return IsNull(tableResultLog.Epay7Column);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public void SetEpay7Null()
		{
			base[tableResultLog.Epay7Column] = Convert.DBNull;
		}
	}

	public class ResultLogItemRow : DataRow
	{
		private ResultLogItemDataTable tableResultLogItem;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public string MAC
		{
			get
			{
				try
				{
					return (string)base[tableResultLogItem.MACColumn];
				}
				catch (InvalidCastException innerException)
				{
					throw new StrongTypingException("表“ResultLogItem”中列“MAC”的值为 DBNull。", innerException);
				}
			}
			set
			{
				base[tableResultLogItem.MACColumn] = value;
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public string Name
		{
			get
			{
				try
				{
					return (string)base[tableResultLogItem.NameColumn];
				}
				catch (InvalidCastException innerException)
				{
					throw new StrongTypingException("表“ResultLogItem”中列“Name”的值为 DBNull。", innerException);
				}
			}
			set
			{
				base[tableResultLogItem.NameColumn] = value;
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public int FID
		{
			get
			{
				try
				{
					return (int)base[tableResultLogItem.FIDColumn];
				}
				catch (InvalidCastException innerException)
				{
					throw new StrongTypingException("表“ResultLogItem”中列“FID”的值为 DBNull。", innerException);
				}
			}
			set
			{
				base[tableResultLogItem.FIDColumn] = value;
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public DateTime DateTime
		{
			get
			{
				try
				{
					return (DateTime)base[tableResultLogItem.DateTimeColumn];
				}
				catch (InvalidCastException innerException)
				{
					throw new StrongTypingException("表“ResultLogItem”中列“DateTime”的值为 DBNull。", innerException);
				}
			}
			set
			{
				base[tableResultLogItem.DateTimeColumn] = value;
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public int SID
		{
			get
			{
				try
				{
					return (int)base[tableResultLogItem.SIDColumn];
				}
				catch (InvalidCastException innerException)
				{
					throw new StrongTypingException("表“ResultLogItem”中列“SID”的值为 DBNull。", innerException);
				}
			}
			set
			{
				base[tableResultLogItem.SIDColumn] = value;
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public int Salesman
		{
			get
			{
				try
				{
					return (int)base[tableResultLogItem.SalesmanColumn];
				}
				catch (InvalidCastException innerException)
				{
					throw new StrongTypingException("表“ResultLogItem”中列“Salesman”的值为 DBNull。", innerException);
				}
			}
			set
			{
				base[tableResultLogItem.SalesmanColumn] = value;
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public int SubID
		{
			get
			{
				try
				{
					return (int)base[tableResultLogItem.SubIDColumn];
				}
				catch (InvalidCastException innerException)
				{
					throw new StrongTypingException("表“ResultLogItem”中列“SubID”的值为 DBNull。", innerException);
				}
			}
			set
			{
				base[tableResultLogItem.SubIDColumn] = value;
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public decimal Price
		{
			get
			{
				try
				{
					return (decimal)base[tableResultLogItem.PriceColumn];
				}
				catch (InvalidCastException innerException)
				{
					throw new StrongTypingException("表“ResultLogItem”中列“Price”的值为 DBNull。", innerException);
				}
			}
			set
			{
				base[tableResultLogItem.PriceColumn] = value;
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public int PLU
		{
			get
			{
				try
				{
					return (int)base[tableResultLogItem.PLUColumn];
				}
				catch (InvalidCastException innerException)
				{
					throw new StrongTypingException("表“ResultLogItem”中列“PLU”的值为 DBNull。", innerException);
				}
			}
			set
			{
				base[tableResultLogItem.PLUColumn] = value;
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public int Class
		{
			get
			{
				try
				{
					return (int)base[tableResultLogItem.ClassColumn];
				}
				catch (InvalidCastException innerException)
				{
					throw new StrongTypingException("表“ResultLogItem”中列“Class”的值为 DBNull。", innerException);
				}
			}
			set
			{
				base[tableResultLogItem.ClassColumn] = value;
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public int Dept
		{
			get
			{
				try
				{
					return (int)base[tableResultLogItem.DeptColumn];
				}
				catch (InvalidCastException innerException)
				{
					throw new StrongTypingException("表“ResultLogItem”中列“Dept”的值为 DBNull。", innerException);
				}
			}
			set
			{
				base[tableResultLogItem.DeptColumn] = value;
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public decimal Cost
		{
			get
			{
				try
				{
					return (decimal)base[tableResultLogItem.CostColumn];
				}
				catch (InvalidCastException innerException)
				{
					throw new StrongTypingException("表“ResultLogItem”中列“Cost”的值为 DBNull。", innerException);
				}
			}
			set
			{
				base[tableResultLogItem.CostColumn] = value;
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public int Unit
		{
			get
			{
				try
				{
					return (int)base[tableResultLogItem.UnitColumn];
				}
				catch (InvalidCastException innerException)
				{
					throw new StrongTypingException("表“ResultLogItem”中列“Unit”的值为 DBNull。", innerException);
				}
			}
			set
			{
				base[tableResultLogItem.UnitColumn] = value;
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public int Type
		{
			get
			{
				try
				{
					return (int)base[tableResultLogItem.TypeColumn];
				}
				catch (InvalidCastException innerException)
				{
					throw new StrongTypingException("表“ResultLogItem”中列“Type”的值为 DBNull。", innerException);
				}
			}
			set
			{
				base[tableResultLogItem.TypeColumn] = value;
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public decimal Tax
		{
			get
			{
				try
				{
					return (decimal)base[tableResultLogItem.TaxColumn];
				}
				catch (InvalidCastException innerException)
				{
					throw new StrongTypingException("表“ResultLogItem”中列“Tax”的值为 DBNull。", innerException);
				}
			}
			set
			{
				base[tableResultLogItem.TaxColumn] = value;
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public decimal Amount
		{
			get
			{
				try
				{
					return (decimal)base[tableResultLogItem.AmountColumn];
				}
				catch (InvalidCastException innerException)
				{
					throw new StrongTypingException("表“ResultLogItem”中列“Amount”的值为 DBNull。", innerException);
				}
			}
			set
			{
				base[tableResultLogItem.AmountColumn] = value;
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public decimal Count
		{
			get
			{
				try
				{
					return (decimal)base[tableResultLogItem.CountColumn];
				}
				catch (InvalidCastException innerException)
				{
					throw new StrongTypingException("表“ResultLogItem”中列“Count”的值为 DBNull。", innerException);
				}
			}
			set
			{
				base[tableResultLogItem.CountColumn] = value;
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public decimal Weight
		{
			get
			{
				try
				{
					return (decimal)base[tableResultLogItem.WeightColumn];
				}
				catch (InvalidCastException innerException)
				{
					throw new StrongTypingException("表“ResultLogItem”中列“Weight”的值为 DBNull。", innerException);
				}
			}
			set
			{
				base[tableResultLogItem.WeightColumn] = value;
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public string Text1
		{
			get
			{
				try
				{
					return (string)base[tableResultLogItem.Text1Column];
				}
				catch (InvalidCastException innerException)
				{
					throw new StrongTypingException("表“ResultLogItem”中列“Text1”的值为 DBNull。", innerException);
				}
			}
			set
			{
				base[tableResultLogItem.Text1Column] = value;
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public string Text2
		{
			get
			{
				try
				{
					return (string)base[tableResultLogItem.Text2Column];
				}
				catch (InvalidCastException innerException)
				{
					throw new StrongTypingException("表“ResultLogItem”中列“Text2”的值为 DBNull。", innerException);
				}
			}
			set
			{
				base[tableResultLogItem.Text2Column] = value;
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public string Text3
		{
			get
			{
				try
				{
					return (string)base[tableResultLogItem.Text3Column];
				}
				catch (InvalidCastException innerException)
				{
					throw new StrongTypingException("表“ResultLogItem”中列“Text3”的值为 DBNull。", innerException);
				}
			}
			set
			{
				base[tableResultLogItem.Text3Column] = value;
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public string Text4
		{
			get
			{
				try
				{
					return (string)base[tableResultLogItem.Text4Column];
				}
				catch (InvalidCastException innerException)
				{
					throw new StrongTypingException("表“ResultLogItem”中列“Text4”的值为 DBNull。", innerException);
				}
			}
			set
			{
				base[tableResultLogItem.Text4Column] = value;
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public decimal UnitPrice
		{
			get
			{
				try
				{
					return (decimal)base[tableResultLogItem.UnitPriceColumn];
				}
				catch (InvalidCastException innerException)
				{
					throw new StrongTypingException("表“ResultLogItem”中列“UnitPrice”的值为 DBNull。", innerException);
				}
			}
			set
			{
				base[tableResultLogItem.UnitPriceColumn] = value;
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public int CoFID
		{
			get
			{
				try
				{
					return (int)base[tableResultLogItem.CoFIDColumn];
				}
				catch (InvalidCastException innerException)
				{
					throw new StrongTypingException("表“ResultLogItem”中列“CoFID”的值为 DBNull。", innerException);
				}
			}
			set
			{
				base[tableResultLogItem.CoFIDColumn] = value;
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public string PLUName
		{
			get
			{
				try
				{
					return (string)base[tableResultLogItem.PLUNameColumn];
				}
				catch (InvalidCastException innerException)
				{
					throw new StrongTypingException("表“ResultLogItem”中列“PLUName”的值为 DBNull。", innerException);
				}
			}
			set
			{
				base[tableResultLogItem.PLUNameColumn] = value;
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		internal ResultLogItemRow(DataRowBuilder rb)
			: base(rb)
		{
			tableResultLogItem = (ResultLogItemDataTable)base.Table;
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public bool IsMACNull()
		{
			return IsNull(tableResultLogItem.MACColumn);
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public void SetMACNull()
		{
			base[tableResultLogItem.MACColumn] = Convert.DBNull;
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public bool IsNameNull()
		{
			return IsNull(tableResultLogItem.NameColumn);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public void SetNameNull()
		{
			base[tableResultLogItem.NameColumn] = Convert.DBNull;
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public bool IsFIDNull()
		{
			return IsNull(tableResultLogItem.FIDColumn);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public void SetFIDNull()
		{
			base[tableResultLogItem.FIDColumn] = Convert.DBNull;
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public bool IsDateTimeNull()
		{
			return IsNull(tableResultLogItem.DateTimeColumn);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public void SetDateTimeNull()
		{
			base[tableResultLogItem.DateTimeColumn] = Convert.DBNull;
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public bool IsSIDNull()
		{
			return IsNull(tableResultLogItem.SIDColumn);
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public void SetSIDNull()
		{
			base[tableResultLogItem.SIDColumn] = Convert.DBNull;
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public bool IsSalesmanNull()
		{
			return IsNull(tableResultLogItem.SalesmanColumn);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public void SetSalesmanNull()
		{
			base[tableResultLogItem.SalesmanColumn] = Convert.DBNull;
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public bool IsSubIDNull()
		{
			return IsNull(tableResultLogItem.SubIDColumn);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public void SetSubIDNull()
		{
			base[tableResultLogItem.SubIDColumn] = Convert.DBNull;
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public bool IsPriceNull()
		{
			return IsNull(tableResultLogItem.PriceColumn);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public void SetPriceNull()
		{
			base[tableResultLogItem.PriceColumn] = Convert.DBNull;
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public bool IsPLUNull()
		{
			return IsNull(tableResultLogItem.PLUColumn);
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public void SetPLUNull()
		{
			base[tableResultLogItem.PLUColumn] = Convert.DBNull;
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public bool IsClassNull()
		{
			return IsNull(tableResultLogItem.ClassColumn);
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public void SetClassNull()
		{
			base[tableResultLogItem.ClassColumn] = Convert.DBNull;
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public bool IsDeptNull()
		{
			return IsNull(tableResultLogItem.DeptColumn);
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public void SetDeptNull()
		{
			base[tableResultLogItem.DeptColumn] = Convert.DBNull;
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public bool IsCostNull()
		{
			return IsNull(tableResultLogItem.CostColumn);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public void SetCostNull()
		{
			base[tableResultLogItem.CostColumn] = Convert.DBNull;
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public bool IsUnitNull()
		{
			return IsNull(tableResultLogItem.UnitColumn);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public void SetUnitNull()
		{
			base[tableResultLogItem.UnitColumn] = Convert.DBNull;
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public bool IsTypeNull()
		{
			return IsNull(tableResultLogItem.TypeColumn);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public void SetTypeNull()
		{
			base[tableResultLogItem.TypeColumn] = Convert.DBNull;
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public bool IsTaxNull()
		{
			return IsNull(tableResultLogItem.TaxColumn);
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public void SetTaxNull()
		{
			base[tableResultLogItem.TaxColumn] = Convert.DBNull;
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public bool IsAmountNull()
		{
			return IsNull(tableResultLogItem.AmountColumn);
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public void SetAmountNull()
		{
			base[tableResultLogItem.AmountColumn] = Convert.DBNull;
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public bool IsCountNull()
		{
			return IsNull(tableResultLogItem.CountColumn);
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public void SetCountNull()
		{
			base[tableResultLogItem.CountColumn] = Convert.DBNull;
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public bool IsWeightNull()
		{
			return IsNull(tableResultLogItem.WeightColumn);
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public void SetWeightNull()
		{
			base[tableResultLogItem.WeightColumn] = Convert.DBNull;
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public bool IsText1Null()
		{
			return IsNull(tableResultLogItem.Text1Column);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public void SetText1Null()
		{
			base[tableResultLogItem.Text1Column] = Convert.DBNull;
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public bool IsText2Null()
		{
			return IsNull(tableResultLogItem.Text2Column);
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public void SetText2Null()
		{
			base[tableResultLogItem.Text2Column] = Convert.DBNull;
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public bool IsText3Null()
		{
			return IsNull(tableResultLogItem.Text3Column);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public void SetText3Null()
		{
			base[tableResultLogItem.Text3Column] = Convert.DBNull;
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public bool IsText4Null()
		{
			return IsNull(tableResultLogItem.Text4Column);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public void SetText4Null()
		{
			base[tableResultLogItem.Text4Column] = Convert.DBNull;
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public bool IsUnitPriceNull()
		{
			return IsNull(tableResultLogItem.UnitPriceColumn);
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public void SetUnitPriceNull()
		{
			base[tableResultLogItem.UnitPriceColumn] = Convert.DBNull;
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public bool IsCoFIDNull()
		{
			return IsNull(tableResultLogItem.CoFIDColumn);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public void SetCoFIDNull()
		{
			base[tableResultLogItem.CoFIDColumn] = Convert.DBNull;
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public bool IsPLUNameNull()
		{
			return IsNull(tableResultLogItem.PLUNameColumn);
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public void SetPLUNameNull()
		{
			base[tableResultLogItem.PLUNameColumn] = Convert.DBNull;
		}
	}

	public class HistoryRow : DataRow
	{
		private HistoryDataTable tableHistory;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public string FileName
		{
			get
			{
				return (string)base[tableHistory.FileNameColumn];
			}
			set
			{
				base[tableHistory.FileNameColumn] = value;
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public DateTime Start
		{
			get
			{
				try
				{
					return (DateTime)base[tableHistory.StartColumn];
				}
				catch (InvalidCastException innerException)
				{
					throw new StrongTypingException("表“History”中列“Start”的值为 DBNull。", innerException);
				}
			}
			set
			{
				base[tableHistory.StartColumn] = value;
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public DateTime End
		{
			get
			{
				try
				{
					return (DateTime)base[tableHistory.EndColumn];
				}
				catch (InvalidCastException innerException)
				{
					throw new StrongTypingException("表“History”中列“End”的值为 DBNull。", innerException);
				}
			}
			set
			{
				base[tableHistory.EndColumn] = value;
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		internal HistoryRow(DataRowBuilder rb)
			: base(rb)
		{
			tableHistory = (HistoryDataTable)base.Table;
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public bool IsStartNull()
		{
			return IsNull(tableHistory.StartColumn);
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public void SetStartNull()
		{
			base[tableHistory.StartColumn] = Convert.DBNull;
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public bool IsEndNull()
		{
			return IsNull(tableHistory.EndColumn);
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public void SetEndNull()
		{
			base[tableHistory.EndColumn] = Convert.DBNull;
		}
	}

	public class StockMultiItemRow : DataRow
	{
		private StockMultiItemDataTable tableStockMultiItem;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public int PLU
		{
			get
			{
				return (int)base[tableStockMultiItem.PLUColumn];
			}
			set
			{
				base[tableStockMultiItem.PLUColumn] = value;
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public DateTime STakingTime
		{
			get
			{
				try
				{
					return (DateTime)base[tableStockMultiItem.STakingTimeColumn];
				}
				catch (InvalidCastException innerException)
				{
					throw new StrongTypingException("表“StockMultiItem”中列“STakingTime”的值为 DBNull。", innerException);
				}
			}
			set
			{
				base[tableStockMultiItem.STakingTimeColumn] = value;
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public decimal Stock
		{
			get
			{
				try
				{
					return (decimal)base[tableStockMultiItem.StockColumn];
				}
				catch (InvalidCastException innerException)
				{
					throw new StrongTypingException("表“StockMultiItem”中列“Stock”的值为 DBNull。", innerException);
				}
			}
			set
			{
				base[tableStockMultiItem.StockColumn] = value;
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public int Unit
		{
			get
			{
				try
				{
					return (int)base[tableStockMultiItem.UnitColumn];
				}
				catch (InvalidCastException innerException)
				{
					throw new StrongTypingException("表“StockMultiItem”中列“Unit”的值为 DBNull。", innerException);
				}
			}
			set
			{
				base[tableStockMultiItem.UnitColumn] = value;
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public decimal SafetyStock
		{
			get
			{
				try
				{
					return (decimal)base[tableStockMultiItem.SafetyStockColumn];
				}
				catch (InvalidCastException innerException)
				{
					throw new StrongTypingException("表“StockMultiItem”中列“SafetyStock”的值为 DBNull。", innerException);
				}
			}
			set
			{
				base[tableStockMultiItem.SafetyStockColumn] = value;
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public bool LowStock
		{
			get
			{
				try
				{
					return (bool)base[tableStockMultiItem.LowStockColumn];
				}
				catch (InvalidCastException innerException)
				{
					throw new StrongTypingException("表“StockMultiItem”中列“LowStock”的值为 DBNull。", innerException);
				}
			}
			set
			{
				base[tableStockMultiItem.LowStockColumn] = value;
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public int Type
		{
			get
			{
				try
				{
					return (int)base[tableStockMultiItem.TypeColumn];
				}
				catch (InvalidCastException innerException)
				{
					throw new StrongTypingException("表“StockMultiItem”中列“Type”的值为 DBNull。", innerException);
				}
			}
			set
			{
				base[tableStockMultiItem.TypeColumn] = value;
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public decimal Unit_Price
		{
			get
			{
				try
				{
					return (decimal)base[tableStockMultiItem.Unit_PriceColumn];
				}
				catch (InvalidCastException innerException)
				{
					throw new StrongTypingException("表“StockMultiItem”中列“Unit Price”的值为 DBNull。", innerException);
				}
			}
			set
			{
				base[tableStockMultiItem.Unit_PriceColumn] = value;
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public decimal Amount
		{
			get
			{
				try
				{
					return (decimal)base[tableStockMultiItem.AmountColumn];
				}
				catch (InvalidCastException innerException)
				{
					throw new StrongTypingException("表“StockMultiItem”中列“Amount”的值为 DBNull。", innerException);
				}
			}
			set
			{
				base[tableStockMultiItem.AmountColumn] = value;
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public decimal StockSP
		{
			get
			{
				try
				{
					return (decimal)base[tableStockMultiItem.StockSPColumn];
				}
				catch (InvalidCastException innerException)
				{
					throw new StrongTypingException("表“StockMultiItem”中列“StockSP”的值为 DBNull。", innerException);
				}
			}
			set
			{
				base[tableStockMultiItem.StockSPColumn] = value;
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public int UnitSP
		{
			get
			{
				try
				{
					return (int)base[tableStockMultiItem.UnitSPColumn];
				}
				catch (InvalidCastException innerException)
				{
					throw new StrongTypingException("表“StockMultiItem”中列“UnitSP”的值为 DBNull。", innerException);
				}
			}
			set
			{
				base[tableStockMultiItem.UnitSPColumn] = value;
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public decimal PriceIn
		{
			get
			{
				try
				{
					return (decimal)base[tableStockMultiItem.PriceInColumn];
				}
				catch (InvalidCastException innerException)
				{
					throw new StrongTypingException("表“StockMultiItem”中列“PriceIn”的值为 DBNull。", innerException);
				}
			}
			set
			{
				base[tableStockMultiItem.PriceInColumn] = value;
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public decimal PriceOut
		{
			get
			{
				try
				{
					return (decimal)base[tableStockMultiItem.PriceOutColumn];
				}
				catch (InvalidCastException innerException)
				{
					throw new StrongTypingException("表“StockMultiItem”中列“PriceOut”的值为 DBNull。", innerException);
				}
			}
			set
			{
				base[tableStockMultiItem.PriceOutColumn] = value;
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		internal StockMultiItemRow(DataRowBuilder rb)
			: base(rb)
		{
			tableStockMultiItem = (StockMultiItemDataTable)base.Table;
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public bool IsSTakingTimeNull()
		{
			return IsNull(tableStockMultiItem.STakingTimeColumn);
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public void SetSTakingTimeNull()
		{
			base[tableStockMultiItem.STakingTimeColumn] = Convert.DBNull;
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public bool IsStockNull()
		{
			return IsNull(tableStockMultiItem.StockColumn);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public void SetStockNull()
		{
			base[tableStockMultiItem.StockColumn] = Convert.DBNull;
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public bool IsUnitNull()
		{
			return IsNull(tableStockMultiItem.UnitColumn);
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public void SetUnitNull()
		{
			base[tableStockMultiItem.UnitColumn] = Convert.DBNull;
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public bool IsSafetyStockNull()
		{
			return IsNull(tableStockMultiItem.SafetyStockColumn);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public void SetSafetyStockNull()
		{
			base[tableStockMultiItem.SafetyStockColumn] = Convert.DBNull;
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public bool IsLowStockNull()
		{
			return IsNull(tableStockMultiItem.LowStockColumn);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public void SetLowStockNull()
		{
			base[tableStockMultiItem.LowStockColumn] = Convert.DBNull;
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public bool IsTypeNull()
		{
			return IsNull(tableStockMultiItem.TypeColumn);
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public void SetTypeNull()
		{
			base[tableStockMultiItem.TypeColumn] = Convert.DBNull;
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public bool IsUnit_PriceNull()
		{
			return IsNull(tableStockMultiItem.Unit_PriceColumn);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public void SetUnit_PriceNull()
		{
			base[tableStockMultiItem.Unit_PriceColumn] = Convert.DBNull;
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public bool IsAmountNull()
		{
			return IsNull(tableStockMultiItem.AmountColumn);
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public void SetAmountNull()
		{
			base[tableStockMultiItem.AmountColumn] = Convert.DBNull;
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public bool IsStockSPNull()
		{
			return IsNull(tableStockMultiItem.StockSPColumn);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public void SetStockSPNull()
		{
			base[tableStockMultiItem.StockSPColumn] = Convert.DBNull;
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public bool IsUnitSPNull()
		{
			return IsNull(tableStockMultiItem.UnitSPColumn);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public void SetUnitSPNull()
		{
			base[tableStockMultiItem.UnitSPColumn] = Convert.DBNull;
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public bool IsPriceInNull()
		{
			return IsNull(tableStockMultiItem.PriceInColumn);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public void SetPriceInNull()
		{
			base[tableStockMultiItem.PriceInColumn] = Convert.DBNull;
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public bool IsPriceOutNull()
		{
			return IsNull(tableStockMultiItem.PriceOutColumn);
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public void SetPriceOutNull()
		{
			base[tableStockMultiItem.PriceOutColumn] = Convert.DBNull;
		}
	}

	public class StockExcelItemRow : DataRow
	{
		private StockExcelItemDataTable tableStockExcelItem;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public int ID
		{
			get
			{
				return (int)base[tableStockExcelItem.IDColumn];
			}
			set
			{
				base[tableStockExcelItem.IDColumn] = value;
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public int PLU
		{
			get
			{
				return (int)base[tableStockExcelItem.PLUColumn];
			}
			set
			{
				base[tableStockExcelItem.PLUColumn] = value;
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public int Type
		{
			get
			{
				try
				{
					return (int)base[tableStockExcelItem.TypeColumn];
				}
				catch (InvalidCastException innerException)
				{
					throw new StrongTypingException("表“StockExcelItem”中列“Type”的值为 DBNull。", innerException);
				}
			}
			set
			{
				base[tableStockExcelItem.TypeColumn] = value;
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public decimal Unit_Price
		{
			get
			{
				try
				{
					return (decimal)base[tableStockExcelItem.Unit_PriceColumn];
				}
				catch (InvalidCastException innerException)
				{
					throw new StrongTypingException("表“StockExcelItem”中列“Unit Price”的值为 DBNull。", innerException);
				}
			}
			set
			{
				base[tableStockExcelItem.Unit_PriceColumn] = value;
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public decimal Total_Price
		{
			get
			{
				try
				{
					return (decimal)base[tableStockExcelItem.Total_PriceColumn];
				}
				catch (InvalidCastException innerException)
				{
					throw new StrongTypingException("表“StockExcelItem”中列“Total Price”的值为 DBNull。", innerException);
				}
			}
			set
			{
				base[tableStockExcelItem.Total_PriceColumn] = value;
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public decimal Amount
		{
			get
			{
				try
				{
					return (decimal)base[tableStockExcelItem.AmountColumn];
				}
				catch (InvalidCastException innerException)
				{
					throw new StrongTypingException("表“StockExcelItem”中列“Amount”的值为 DBNull。", innerException);
				}
			}
			set
			{
				base[tableStockExcelItem.AmountColumn] = value;
			}
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public int Unit
		{
			get
			{
				try
				{
					return (int)base[tableStockExcelItem.UnitColumn];
				}
				catch (InvalidCastException innerException)
				{
					throw new StrongTypingException("表“StockExcelItem”中列“Unit”的值为 DBNull。", innerException);
				}
			}
			set
			{
				base[tableStockExcelItem.UnitColumn] = value;
			}
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		internal StockExcelItemRow(DataRowBuilder rb)
			: base(rb)
		{
			tableStockExcelItem = (StockExcelItemDataTable)base.Table;
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public bool IsTypeNull()
		{
			return IsNull(tableStockExcelItem.TypeColumn);
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public void SetTypeNull()
		{
			base[tableStockExcelItem.TypeColumn] = Convert.DBNull;
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public bool IsUnit_PriceNull()
		{
			return IsNull(tableStockExcelItem.Unit_PriceColumn);
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public void SetUnit_PriceNull()
		{
			base[tableStockExcelItem.Unit_PriceColumn] = Convert.DBNull;
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public bool IsTotal_PriceNull()
		{
			return IsNull(tableStockExcelItem.Total_PriceColumn);
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public void SetTotal_PriceNull()
		{
			base[tableStockExcelItem.Total_PriceColumn] = Convert.DBNull;
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public bool IsAmountNull()
		{
			return IsNull(tableStockExcelItem.AmountColumn);
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public void SetAmountNull()
		{
			base[tableStockExcelItem.AmountColumn] = Convert.DBNull;
		}

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public bool IsUnitNull()
		{
			return IsNull(tableStockExcelItem.UnitColumn);
		}

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public void SetUnitNull()
		{
			base[tableStockExcelItem.UnitColumn] = Convert.DBNull;
		}
	}

	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	public class ExprRowChangeEvent : EventArgs
	{
		private ExprRow eventRow;

		private DataRowAction eventAction;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public ExprRow Row => eventRow;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public DataRowAction Action => eventAction;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public ExprRowChangeEvent(ExprRow row, DataRowAction action)
		{
			eventRow = row;
			eventAction = action;
		}
	}

	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	public class ExcelRowChangeEvent : EventArgs
	{
		private ExcelRow eventRow;

		private DataRowAction eventAction;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public ExcelRow Row => eventRow;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public DataRowAction Action => eventAction;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public ExcelRowChangeEvent(ExcelRow row, DataRowAction action)
		{
			eventRow = row;
			eventAction = action;
		}
	}

	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	public class DeviceRowChangeEvent : EventArgs
	{
		private DeviceRow eventRow;

		private DataRowAction eventAction;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public DeviceRow Row => eventRow;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public DataRowAction Action => eventAction;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public DeviceRowChangeEvent(DeviceRow row, DataRowAction action)
		{
			eventRow = row;
			eventAction = action;
		}
	}

	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	public class LogRowChangeEvent : EventArgs
	{
		private LogRow eventRow;

		private DataRowAction eventAction;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public LogRow Row => eventRow;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public DataRowAction Action => eventAction;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public LogRowChangeEvent(LogRow row, DataRowAction action)
		{
			eventRow = row;
			eventAction = action;
		}
	}

	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	public class LogItemRowChangeEvent : EventArgs
	{
		private LogItemRow eventRow;

		private DataRowAction eventAction;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public LogItemRow Row => eventRow;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public DataRowAction Action => eventAction;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public LogItemRowChangeEvent(LogItemRow row, DataRowAction action)
		{
			eventRow = row;
			eventAction = action;
		}
	}

	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	public class SGroupRowChangeEvent : EventArgs
	{
		private SGroupRow eventRow;

		private DataRowAction eventAction;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public SGroupRow Row => eventRow;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public DataRowAction Action => eventAction;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public SGroupRowChangeEvent(SGroupRow row, DataRowAction action)
		{
			eventRow = row;
			eventAction = action;
		}
	}

	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	public class StockRowChangeEvent : EventArgs
	{
		private StockRow eventRow;

		private DataRowAction eventAction;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public StockRow Row => eventRow;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public DataRowAction Action => eventAction;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public StockRowChangeEvent(StockRow row, DataRowAction action)
		{
			eventRow = row;
			eventAction = action;
		}
	}

	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	public class StockItemRowChangeEvent : EventArgs
	{
		private StockItemRow eventRow;

		private DataRowAction eventAction;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public StockItemRow Row => eventRow;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public DataRowAction Action => eventAction;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public StockItemRowChangeEvent(StockItemRow row, DataRowAction action)
		{
			eventRow = row;
			eventAction = action;
		}
	}

	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	public class rPLURowChangeEvent : EventArgs
	{
		private rPLURow eventRow;

		private DataRowAction eventAction;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public rPLURow Row => eventRow;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public DataRowAction Action => eventAction;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public rPLURowChangeEvent(rPLURow row, DataRowAction action)
		{
			eventRow = row;
			eventAction = action;
		}
	}

	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	public class rUnitRowChangeEvent : EventArgs
	{
		private rUnitRow eventRow;

		private DataRowAction eventAction;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public rUnitRow Row => eventRow;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public DataRowAction Action => eventAction;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public rUnitRowChangeEvent(rUnitRow row, DataRowAction action)
		{
			eventRow = row;
			eventAction = action;
		}
	}

	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	public class AllLogsRowChangeEvent : EventArgs
	{
		private AllLogsRow eventRow;

		private DataRowAction eventAction;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public AllLogsRow Row => eventRow;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public DataRowAction Action => eventAction;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public AllLogsRowChangeEvent(AllLogsRow row, DataRowAction action)
		{
			eventRow = row;
			eventAction = action;
		}
	}

	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	public class AllStocksRowChangeEvent : EventArgs
	{
		private AllStocksRow eventRow;

		private DataRowAction eventAction;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public AllStocksRow Row => eventRow;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public DataRowAction Action => eventAction;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public AllStocksRowChangeEvent(AllStocksRow row, DataRowAction action)
		{
			eventRow = row;
			eventAction = action;
		}
	}

	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	public class rLogsTypeRowChangeEvent : EventArgs
	{
		private rLogsTypeRow eventRow;

		private DataRowAction eventAction;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public rLogsTypeRow Row => eventRow;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public DataRowAction Action => eventAction;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public rLogsTypeRowChangeEvent(rLogsTypeRow row, DataRowAction action)
		{
			eventRow = row;
			eventAction = action;
		}
	}

	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	public class rStockTypeRowChangeEvent : EventArgs
	{
		private rStockTypeRow eventRow;

		private DataRowAction eventAction;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public rStockTypeRow Row => eventRow;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public DataRowAction Action => eventAction;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public rStockTypeRowChangeEvent(rStockTypeRow row, DataRowAction action)
		{
			eventRow = row;
			eventAction = action;
		}
	}

	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	public class ResultLogRowChangeEvent : EventArgs
	{
		private ResultLogRow eventRow;

		private DataRowAction eventAction;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public ResultLogRow Row => eventRow;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public DataRowAction Action => eventAction;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public ResultLogRowChangeEvent(ResultLogRow row, DataRowAction action)
		{
			eventRow = row;
			eventAction = action;
		}
	}

	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	public class ResultLogItemRowChangeEvent : EventArgs
	{
		private ResultLogItemRow eventRow;

		private DataRowAction eventAction;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public ResultLogItemRow Row => eventRow;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public DataRowAction Action => eventAction;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public ResultLogItemRowChangeEvent(ResultLogItemRow row, DataRowAction action)
		{
			eventRow = row;
			eventAction = action;
		}
	}

	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	public class HistoryRowChangeEvent : EventArgs
	{
		private HistoryRow eventRow;

		private DataRowAction eventAction;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public HistoryRow Row => eventRow;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public DataRowAction Action => eventAction;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public HistoryRowChangeEvent(HistoryRow row, DataRowAction action)
		{
			eventRow = row;
			eventAction = action;
		}
	}

	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	public class StockMultiItemRowChangeEvent : EventArgs
	{
		private StockMultiItemRow eventRow;

		private DataRowAction eventAction;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public StockMultiItemRow Row => eventRow;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public DataRowAction Action => eventAction;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public StockMultiItemRowChangeEvent(StockMultiItemRow row, DataRowAction action)
		{
			eventRow = row;
			eventAction = action;
		}
	}

	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	public class StockExcelItemRowChangeEvent : EventArgs
	{
		private StockExcelItemRow eventRow;

		private DataRowAction eventAction;

		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		[DebuggerNonUserCode]
		public StockExcelItemRow Row => eventRow;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public DataRowAction Action => eventAction;

		[DebuggerNonUserCode]
		[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
		public StockExcelItemRowChangeEvent(StockExcelItemRow row, DataRowAction action)
		{
			eventRow = row;
			eventAction = action;
		}
	}

	private ExprDataTable tableExpr;

	private ExcelDataTable tableExcel;

	private DeviceDataTable tableDevice;

	private LogDataTable tableLog;

	private LogItemDataTable tableLogItem;

	private SGroupDataTable tableSGroup;

	private StockDataTable tableStock;

	private StockItemDataTable tableStockItem;

	private rPLUDataTable tablerPLU;

	private rUnitDataTable tablerUnit;

	private AllLogsDataTable tableAllLogs;

	private AllStocksDataTable tableAllStocks;

	private rLogsTypeDataTable tablerLogsType;

	private rStockTypeDataTable tablerStockType;

	private ResultLogDataTable tableResultLog;

	private ResultLogItemDataTable tableResultLogItem;

	private HistoryDataTable tableHistory;

	private StockMultiItemDataTable tableStockMultiItem;

	private StockExcelItemDataTable tableStockExcelItem;

	private DataRelation relationFK_SGroup_Device;

	private DataRelation relationFK_SGroup_Stock;

	private DataRelation relationFK_SGroup_StockItem;

	private DataRelation relationFK_Device_Log;

	private DataRelation relationFK_Log_LogItem;

	private SchemaSerializationMode _schemaSerializationMode = SchemaSerializationMode.IncludeSchema;

	[DebuggerNonUserCode]
	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	[DesignerSerializationVisibility(DesignerSerializationVisibility.Content)]
	[Browsable(false)]
	public ExprDataTable Expr => tableExpr;

	[Browsable(false)]
	[DebuggerNonUserCode]
	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	[DesignerSerializationVisibility(DesignerSerializationVisibility.Content)]
	public ExcelDataTable Excel => tableExcel;

	[DesignerSerializationVisibility(DesignerSerializationVisibility.Content)]
	[DebuggerNonUserCode]
	[Browsable(false)]
	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	public DeviceDataTable Device => tableDevice;

	[Browsable(false)]
	[DebuggerNonUserCode]
	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	[DesignerSerializationVisibility(DesignerSerializationVisibility.Content)]
	public LogDataTable Log => tableLog;

	[Browsable(false)]
	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	[DesignerSerializationVisibility(DesignerSerializationVisibility.Content)]
	[DebuggerNonUserCode]
	public LogItemDataTable LogItem => tableLogItem;

	[DebuggerNonUserCode]
	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	[Browsable(false)]
	[DesignerSerializationVisibility(DesignerSerializationVisibility.Content)]
	public SGroupDataTable SGroup => tableSGroup;

	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	[Browsable(false)]
	[DebuggerNonUserCode]
	[DesignerSerializationVisibility(DesignerSerializationVisibility.Content)]
	public StockDataTable Stock => tableStock;

	[DesignerSerializationVisibility(DesignerSerializationVisibility.Content)]
	[DebuggerNonUserCode]
	[Browsable(false)]
	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	public StockItemDataTable StockItem => tableStockItem;

	[DesignerSerializationVisibility(DesignerSerializationVisibility.Content)]
	[Browsable(false)]
	[DebuggerNonUserCode]
	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	public rPLUDataTable rPLU => tablerPLU;

	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	[DebuggerNonUserCode]
	[Browsable(false)]
	[DesignerSerializationVisibility(DesignerSerializationVisibility.Content)]
	public rUnitDataTable rUnit => tablerUnit;

	[DesignerSerializationVisibility(DesignerSerializationVisibility.Content)]
	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	[Browsable(false)]
	[DebuggerNonUserCode]
	public AllLogsDataTable AllLogs => tableAllLogs;

	[DesignerSerializationVisibility(DesignerSerializationVisibility.Content)]
	[DebuggerNonUserCode]
	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	[Browsable(false)]
	public AllStocksDataTable AllStocks => tableAllStocks;

	[DesignerSerializationVisibility(DesignerSerializationVisibility.Content)]
	[DebuggerNonUserCode]
	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	[Browsable(false)]
	public rLogsTypeDataTable rLogsType => tablerLogsType;

	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	[DesignerSerializationVisibility(DesignerSerializationVisibility.Content)]
	[DebuggerNonUserCode]
	[Browsable(false)]
	public rStockTypeDataTable rStockType => tablerStockType;

	[DesignerSerializationVisibility(DesignerSerializationVisibility.Content)]
	[DebuggerNonUserCode]
	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	[Browsable(false)]
	public ResultLogDataTable ResultLog => tableResultLog;

	[DesignerSerializationVisibility(DesignerSerializationVisibility.Content)]
	[DebuggerNonUserCode]
	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	[Browsable(false)]
	public ResultLogItemDataTable ResultLogItem => tableResultLogItem;

	[DesignerSerializationVisibility(DesignerSerializationVisibility.Content)]
	[DebuggerNonUserCode]
	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	[Browsable(false)]
	public HistoryDataTable History => tableHistory;

	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	[DebuggerNonUserCode]
	[DesignerSerializationVisibility(DesignerSerializationVisibility.Content)]
	[Browsable(false)]
	public StockMultiItemDataTable StockMultiItem => tableStockMultiItem;

	[DebuggerNonUserCode]
	[DesignerSerializationVisibility(DesignerSerializationVisibility.Content)]
	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	[Browsable(false)]
	public StockExcelItemDataTable StockExcelItem => tableStockExcelItem;

	[DebuggerNonUserCode]
	[DesignerSerializationVisibility(DesignerSerializationVisibility.Visible)]
	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	[Browsable(true)]
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

	[DebuggerNonUserCode]
	[DesignerSerializationVisibility(DesignerSerializationVisibility.Hidden)]
	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	public new DataTableCollection Tables => base.Tables;

	[DebuggerNonUserCode]
	[DesignerSerializationVisibility(DesignerSerializationVisibility.Hidden)]
	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	public new DataRelationCollection Relations => base.Relations;

	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	[DebuggerNonUserCode]
	public ReportDataSet()
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
	protected ReportDataSet(SerializationInfo info, StreamingContext context)
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
			if (dataSet.Tables["Expr"] != null)
			{
				base.Tables.Add(new ExprDataTable(dataSet.Tables["Expr"]));
			}
			if (dataSet.Tables["Excel"] != null)
			{
				base.Tables.Add(new ExcelDataTable(dataSet.Tables["Excel"]));
			}
			if (dataSet.Tables["Device"] != null)
			{
				base.Tables.Add(new DeviceDataTable(dataSet.Tables["Device"]));
			}
			if (dataSet.Tables["Log"] != null)
			{
				base.Tables.Add(new LogDataTable(dataSet.Tables["Log"]));
			}
			if (dataSet.Tables["LogItem"] != null)
			{
				base.Tables.Add(new LogItemDataTable(dataSet.Tables["LogItem"]));
			}
			if (dataSet.Tables["SGroup"] != null)
			{
				base.Tables.Add(new SGroupDataTable(dataSet.Tables["SGroup"]));
			}
			if (dataSet.Tables["Stock"] != null)
			{
				base.Tables.Add(new StockDataTable(dataSet.Tables["Stock"]));
			}
			if (dataSet.Tables["StockItem"] != null)
			{
				base.Tables.Add(new StockItemDataTable(dataSet.Tables["StockItem"]));
			}
			if (dataSet.Tables["rPLU"] != null)
			{
				base.Tables.Add(new rPLUDataTable(dataSet.Tables["rPLU"]));
			}
			if (dataSet.Tables["rUnit"] != null)
			{
				base.Tables.Add(new rUnitDataTable(dataSet.Tables["rUnit"]));
			}
			if (dataSet.Tables["AllLogs"] != null)
			{
				base.Tables.Add(new AllLogsDataTable(dataSet.Tables["AllLogs"]));
			}
			if (dataSet.Tables["AllStocks"] != null)
			{
				base.Tables.Add(new AllStocksDataTable(dataSet.Tables["AllStocks"]));
			}
			if (dataSet.Tables["rLogsType"] != null)
			{
				base.Tables.Add(new rLogsTypeDataTable(dataSet.Tables["rLogsType"]));
			}
			if (dataSet.Tables["rStockType"] != null)
			{
				base.Tables.Add(new rStockTypeDataTable(dataSet.Tables["rStockType"]));
			}
			if (dataSet.Tables["ResultLog"] != null)
			{
				base.Tables.Add(new ResultLogDataTable(dataSet.Tables["ResultLog"]));
			}
			if (dataSet.Tables["ResultLogItem"] != null)
			{
				base.Tables.Add(new ResultLogItemDataTable(dataSet.Tables["ResultLogItem"]));
			}
			if (dataSet.Tables["History"] != null)
			{
				base.Tables.Add(new HistoryDataTable(dataSet.Tables["History"]));
			}
			if (dataSet.Tables["StockMultiItem"] != null)
			{
				base.Tables.Add(new StockMultiItemDataTable(dataSet.Tables["StockMultiItem"]));
			}
			if (dataSet.Tables["StockExcelItem"] != null)
			{
				base.Tables.Add(new StockExcelItemDataTable(dataSet.Tables["StockExcelItem"]));
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

	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	[DebuggerNonUserCode]
	protected override void InitializeDerivedDataSet()
	{
		BeginInit();
		InitClass();
		EndInit();
	}

	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	[DebuggerNonUserCode]
	public override DataSet Clone()
	{
		ReportDataSet reportDataSet = (ReportDataSet)base.Clone();
		reportDataSet.InitVars();
		reportDataSet.SchemaSerializationMode = SchemaSerializationMode;
		return reportDataSet;
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

	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	[DebuggerNonUserCode]
	protected override void ReadXmlSerializable(XmlReader reader)
	{
		if (DetermineSchemaSerializationMode(reader) == SchemaSerializationMode.IncludeSchema)
		{
			Reset();
			DataSet dataSet = new DataSet();
			dataSet.ReadXml(reader);
			if (dataSet.Tables["Expr"] != null)
			{
				base.Tables.Add(new ExprDataTable(dataSet.Tables["Expr"]));
			}
			if (dataSet.Tables["Excel"] != null)
			{
				base.Tables.Add(new ExcelDataTable(dataSet.Tables["Excel"]));
			}
			if (dataSet.Tables["Device"] != null)
			{
				base.Tables.Add(new DeviceDataTable(dataSet.Tables["Device"]));
			}
			if (dataSet.Tables["Log"] != null)
			{
				base.Tables.Add(new LogDataTable(dataSet.Tables["Log"]));
			}
			if (dataSet.Tables["LogItem"] != null)
			{
				base.Tables.Add(new LogItemDataTable(dataSet.Tables["LogItem"]));
			}
			if (dataSet.Tables["SGroup"] != null)
			{
				base.Tables.Add(new SGroupDataTable(dataSet.Tables["SGroup"]));
			}
			if (dataSet.Tables["Stock"] != null)
			{
				base.Tables.Add(new StockDataTable(dataSet.Tables["Stock"]));
			}
			if (dataSet.Tables["StockItem"] != null)
			{
				base.Tables.Add(new StockItemDataTable(dataSet.Tables["StockItem"]));
			}
			if (dataSet.Tables["rPLU"] != null)
			{
				base.Tables.Add(new rPLUDataTable(dataSet.Tables["rPLU"]));
			}
			if (dataSet.Tables["rUnit"] != null)
			{
				base.Tables.Add(new rUnitDataTable(dataSet.Tables["rUnit"]));
			}
			if (dataSet.Tables["AllLogs"] != null)
			{
				base.Tables.Add(new AllLogsDataTable(dataSet.Tables["AllLogs"]));
			}
			if (dataSet.Tables["AllStocks"] != null)
			{
				base.Tables.Add(new AllStocksDataTable(dataSet.Tables["AllStocks"]));
			}
			if (dataSet.Tables["rLogsType"] != null)
			{
				base.Tables.Add(new rLogsTypeDataTable(dataSet.Tables["rLogsType"]));
			}
			if (dataSet.Tables["rStockType"] != null)
			{
				base.Tables.Add(new rStockTypeDataTable(dataSet.Tables["rStockType"]));
			}
			if (dataSet.Tables["ResultLog"] != null)
			{
				base.Tables.Add(new ResultLogDataTable(dataSet.Tables["ResultLog"]));
			}
			if (dataSet.Tables["ResultLogItem"] != null)
			{
				base.Tables.Add(new ResultLogItemDataTable(dataSet.Tables["ResultLogItem"]));
			}
			if (dataSet.Tables["History"] != null)
			{
				base.Tables.Add(new HistoryDataTable(dataSet.Tables["History"]));
			}
			if (dataSet.Tables["StockMultiItem"] != null)
			{
				base.Tables.Add(new StockMultiItemDataTable(dataSet.Tables["StockMultiItem"]));
			}
			if (dataSet.Tables["StockExcelItem"] != null)
			{
				base.Tables.Add(new StockExcelItemDataTable(dataSet.Tables["StockExcelItem"]));
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

	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	[DebuggerNonUserCode]
	internal void InitVars(bool initTable)
	{
		tableExpr = (ExprDataTable)base.Tables["Expr"];
		if (initTable && tableExpr != null)
		{
			tableExpr.InitVars();
		}
		tableExcel = (ExcelDataTable)base.Tables["Excel"];
		if (initTable && tableExcel != null)
		{
			tableExcel.InitVars();
		}
		tableDevice = (DeviceDataTable)base.Tables["Device"];
		if (initTable && tableDevice != null)
		{
			tableDevice.InitVars();
		}
		tableLog = (LogDataTable)base.Tables["Log"];
		if (initTable && tableLog != null)
		{
			tableLog.InitVars();
		}
		tableLogItem = (LogItemDataTable)base.Tables["LogItem"];
		if (initTable && tableLogItem != null)
		{
			tableLogItem.InitVars();
		}
		tableSGroup = (SGroupDataTable)base.Tables["SGroup"];
		if (initTable && tableSGroup != null)
		{
			tableSGroup.InitVars();
		}
		tableStock = (StockDataTable)base.Tables["Stock"];
		if (initTable && tableStock != null)
		{
			tableStock.InitVars();
		}
		tableStockItem = (StockItemDataTable)base.Tables["StockItem"];
		if (initTable && tableStockItem != null)
		{
			tableStockItem.InitVars();
		}
		tablerPLU = (rPLUDataTable)base.Tables["rPLU"];
		if (initTable && tablerPLU != null)
		{
			tablerPLU.InitVars();
		}
		tablerUnit = (rUnitDataTable)base.Tables["rUnit"];
		if (initTable && tablerUnit != null)
		{
			tablerUnit.InitVars();
		}
		tableAllLogs = (AllLogsDataTable)base.Tables["AllLogs"];
		if (initTable && tableAllLogs != null)
		{
			tableAllLogs.InitVars();
		}
		tableAllStocks = (AllStocksDataTable)base.Tables["AllStocks"];
		if (initTable && tableAllStocks != null)
		{
			tableAllStocks.InitVars();
		}
		tablerLogsType = (rLogsTypeDataTable)base.Tables["rLogsType"];
		if (initTable && tablerLogsType != null)
		{
			tablerLogsType.InitVars();
		}
		tablerStockType = (rStockTypeDataTable)base.Tables["rStockType"];
		if (initTable && tablerStockType != null)
		{
			tablerStockType.InitVars();
		}
		tableResultLog = (ResultLogDataTable)base.Tables["ResultLog"];
		if (initTable && tableResultLog != null)
		{
			tableResultLog.InitVars();
		}
		tableResultLogItem = (ResultLogItemDataTable)base.Tables["ResultLogItem"];
		if (initTable && tableResultLogItem != null)
		{
			tableResultLogItem.InitVars();
		}
		tableHistory = (HistoryDataTable)base.Tables["History"];
		if (initTable && tableHistory != null)
		{
			tableHistory.InitVars();
		}
		tableStockMultiItem = (StockMultiItemDataTable)base.Tables["StockMultiItem"];
		if (initTable && tableStockMultiItem != null)
		{
			tableStockMultiItem.InitVars();
		}
		tableStockExcelItem = (StockExcelItemDataTable)base.Tables["StockExcelItem"];
		if (initTable && tableStockExcelItem != null)
		{
			tableStockExcelItem.InitVars();
		}
		relationFK_SGroup_Device = Relations["FK_SGroup_Device"];
		relationFK_SGroup_Stock = Relations["FK_SGroup_Stock"];
		relationFK_SGroup_StockItem = Relations["FK_SGroup_StockItem"];
		relationFK_Device_Log = Relations["FK_Device_Log"];
		relationFK_Log_LogItem = Relations["FK_Log_LogItem"];
	}

	[DebuggerNonUserCode]
	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	private void InitClass()
	{
		base.DataSetName = "ReportDataSet";
		base.Prefix = "";
		base.Namespace = "http://tempuri.org/ReportDataSet.xsd";
		base.EnforceConstraints = true;
		SchemaSerializationMode = SchemaSerializationMode.IncludeSchema;
		tableExpr = new ExprDataTable();
		base.Tables.Add(tableExpr);
		tableExcel = new ExcelDataTable();
		base.Tables.Add(tableExcel);
		tableDevice = new DeviceDataTable();
		base.Tables.Add(tableDevice);
		tableLog = new LogDataTable();
		base.Tables.Add(tableLog);
		tableLogItem = new LogItemDataTable();
		base.Tables.Add(tableLogItem);
		tableSGroup = new SGroupDataTable();
		base.Tables.Add(tableSGroup);
		tableStock = new StockDataTable();
		base.Tables.Add(tableStock);
		tableStockItem = new StockItemDataTable();
		base.Tables.Add(tableStockItem);
		tablerPLU = new rPLUDataTable();
		base.Tables.Add(tablerPLU);
		tablerUnit = new rUnitDataTable();
		base.Tables.Add(tablerUnit);
		tableAllLogs = new AllLogsDataTable();
		base.Tables.Add(tableAllLogs);
		tableAllStocks = new AllStocksDataTable();
		base.Tables.Add(tableAllStocks);
		tablerLogsType = new rLogsTypeDataTable();
		base.Tables.Add(tablerLogsType);
		tablerStockType = new rStockTypeDataTable();
		base.Tables.Add(tablerStockType);
		tableResultLog = new ResultLogDataTable();
		base.Tables.Add(tableResultLog);
		tableResultLogItem = new ResultLogItemDataTable();
		base.Tables.Add(tableResultLogItem);
		tableHistory = new HistoryDataTable();
		base.Tables.Add(tableHistory);
		tableStockMultiItem = new StockMultiItemDataTable();
		base.Tables.Add(tableStockMultiItem);
		tableStockExcelItem = new StockExcelItemDataTable();
		base.Tables.Add(tableStockExcelItem);
		relationFK_SGroup_Device = new DataRelation("FK_SGroup_Device", new DataColumn[1] { tableSGroup.GIDColumn }, new DataColumn[1] { tableDevice.GIDColumn }, createConstraints: false);
		Relations.Add(relationFK_SGroup_Device);
		relationFK_SGroup_Stock = new DataRelation("FK_SGroup_Stock", new DataColumn[1] { tableSGroup.GIDColumn }, new DataColumn[1] { tableStock.GIDColumn }, createConstraints: false);
		Relations.Add(relationFK_SGroup_Stock);
		relationFK_SGroup_StockItem = new DataRelation("FK_SGroup_StockItem", new DataColumn[1] { tableSGroup.GIDColumn }, new DataColumn[1] { tableStockItem.GIDColumn }, createConstraints: false);
		Relations.Add(relationFK_SGroup_StockItem);
		relationFK_Device_Log = new DataRelation("FK_Device_Log", new DataColumn[1] { tableDevice.MACColumn }, new DataColumn[1] { tableLog.MACColumn }, createConstraints: false);
		Relations.Add(relationFK_Device_Log);
		relationFK_Log_LogItem = new DataRelation("FK_Log_LogItem", new DataColumn[2] { tableLog.MACColumn, tableLog.FIDColumn }, new DataColumn[2] { tableLogItem.MACColumn, tableLogItem.FIDColumn }, createConstraints: false);
		Relations.Add(relationFK_Log_LogItem);
	}

	[DebuggerNonUserCode]
	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	private bool ShouldSerializeExpr()
	{
		return false;
	}

	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	[DebuggerNonUserCode]
	private bool ShouldSerializeExcel()
	{
		return false;
	}

	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	[DebuggerNonUserCode]
	private bool ShouldSerializeDevice()
	{
		return false;
	}

	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	[DebuggerNonUserCode]
	private bool ShouldSerializeLog()
	{
		return false;
	}

	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	[DebuggerNonUserCode]
	private bool ShouldSerializeLogItem()
	{
		return false;
	}

	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	[DebuggerNonUserCode]
	private bool ShouldSerializeSGroup()
	{
		return false;
	}

	[DebuggerNonUserCode]
	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	private bool ShouldSerializeStock()
	{
		return false;
	}

	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	[DebuggerNonUserCode]
	private bool ShouldSerializeStockItem()
	{
		return false;
	}

	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	[DebuggerNonUserCode]
	private bool ShouldSerializerPLU()
	{
		return false;
	}

	[DebuggerNonUserCode]
	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	private bool ShouldSerializerUnit()
	{
		return false;
	}

	[DebuggerNonUserCode]
	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	private bool ShouldSerializeAllLogs()
	{
		return false;
	}

	[DebuggerNonUserCode]
	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	private bool ShouldSerializeAllStocks()
	{
		return false;
	}

	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	[DebuggerNonUserCode]
	private bool ShouldSerializerLogsType()
	{
		return false;
	}

	[DebuggerNonUserCode]
	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	private bool ShouldSerializerStockType()
	{
		return false;
	}

	[DebuggerNonUserCode]
	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	private bool ShouldSerializeResultLog()
	{
		return false;
	}

	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	[DebuggerNonUserCode]
	private bool ShouldSerializeResultLogItem()
	{
		return false;
	}

	[DebuggerNonUserCode]
	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	private bool ShouldSerializeHistory()
	{
		return false;
	}

	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	[DebuggerNonUserCode]
	private bool ShouldSerializeStockMultiItem()
	{
		return false;
	}

	[DebuggerNonUserCode]
	[GeneratedCode("System.Data.Design.TypedDataSetGenerator", "4.0.0.0")]
	private bool ShouldSerializeStockExcelItem()
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
		ReportDataSet reportDataSet = new ReportDataSet();
		XmlSchemaComplexType xmlSchemaComplexType = new XmlSchemaComplexType();
		XmlSchemaSequence xmlSchemaSequence = new XmlSchemaSequence();
		XmlSchemaAny xmlSchemaAny = new XmlSchemaAny();
		xmlSchemaAny.Namespace = reportDataSet.Namespace;
		xmlSchemaSequence.Items.Add(xmlSchemaAny);
		xmlSchemaComplexType.Particle = xmlSchemaSequence;
		XmlSchema schemaSerializable = reportDataSet.GetSchemaSerializable();
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
