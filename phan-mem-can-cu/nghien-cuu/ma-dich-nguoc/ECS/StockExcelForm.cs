using System;
using System.ComponentModel;
using System.Data;
using System.Data.OleDb;
using System.Diagnostics;
using System.Drawing;
using System.Globalization;
using System.IO;
using System.Windows.Forms;
using ECS.ECSDataSetTableAdapters;
using ECS.Properties;
using ECS.ReportDataSetTableAdapters;

namespace ECS;

public class StockExcelForm : Form
{
	private class SimComboVD_No
	{
		private int value;

		private string display;

		public int Value
		{
			get
			{
				return value;
			}
			set
			{
				this.value = value;
			}
		}

		public string Display
		{
			get
			{
				return display;
			}
			set
			{
				display = value;
			}
		}
	}

	private IContainer components;

	private UIDataSet uiDataSet;

	private ECSDataSet ecsDataSet;

	private PLUTableAdapter pluTableAdapter;

	private ComboBox Type_ComboBox;

	private NumericUpDown Type_FromExcel_NumericUpDown;

	private RadioButton Type_FromExcel_RadioButton;

	private RadioButton Type_Const_RadioButton;

	private GroupBox Type_GroupBox;

	private GroupBox PLU_GroupBox;

	private RadioButton PLU_FromExcel_RadioButton;

	private NumericUpDown PLU_FromExcel_NumericUpDown;

	private GroupBox Unit_GroupBox;

	private RadioButton Unit_FromPLUUnit_RadioButton;

	private RadioButton Unit_FromExcel_RadioButton;

	private NumericUpDown Unit_FromExcel_NumericUpDown;

	private GroupBox Amount_GroupBox;

	private RadioButton Amount_FromExcel_RadioButton;

	private NumericUpDown Amount_FromExcel_NumericUpDown;

	private GroupBox Price_GroupBox;

	private RadioButton UnitPrice_FromZERO_RadioButton;

	private RadioButton UnitPrice_FromPLUPrice_RadioButton;

	private RadioButton UnitPrice_FromPLUCost_RadioButton;

	private RadioButton UnitPrice_FromExcel_RadioButton;

	private NumericUpDown UnitPrice_FromExcel_NumericUpDown;

	private Button okButton;

	private Button cancelButton;

	private SplitContainer se_SplitContainer;

	private DataGridView smi_DataGridView;

	private BindingSource stockExcelItemBindingSource;

	private ReportDataSet reportDataSet;

	private BindingSource pluBindingSource;

	private BindingSource unitBindingSource;

	private BindingNavigator stockMultiItemBindingNavigator;

	private ToolStripButton bindingNavigatorAddNewItem;

	private ToolStripLabel bindingNavigatorCountItem;

	private ToolStripButton bindingNavigatorDeleteItem;

	private ToolStripButton bindingNavigatorMoveFirstItem;

	private ToolStripButton bindingNavigatorMovePreviousItem;

	private ToolStripSeparator bindingNavigatorSeparator;

	private ToolStripTextBox bindingNavigatorPositionItem;

	private ToolStripSeparator bindingNavigatorSeparator1;

	private ToolStripButton bindingNavigatorMoveNextItem;

	private ToolStripButton bindingNavigatorMoveLastItem;

	private ToolStripSeparator bindingNavigatorSeparator2;

	private StockItemTableAdapter stockItemTableAdapter;

	private LogItemTableAdapter logItemTableAdapter;

	private LogTableAdapter logTableAdapter;

	private SGroupTableAdapter sGroupTableAdapter;

	private DeviceTableAdapter deviceTableAdapter;

	private StockTableAdapter stockTableAdapter;

	private DataGridViewTextBoxColumn iDDataGridViewTextBoxColumn;

	private DataGridViewTextBoxColumn pLUDataGridViewTextBoxColumn;

	private DataGridViewComboBoxColumn pLUDataGridViewComboBoxColumn;

	private DataGridViewComboBoxColumn typeDataGridViewTextBoxColumn;

	private DataGridViewTextBoxColumn unitPriceDataGridViewTextBoxColumn;

	private DataGridViewTextBoxColumn totalPriceDataGridViewTextBoxColumn;

	private DataGridViewTextBoxColumn amountDataGridViewTextBoxColumn;

	private DataGridViewComboBoxColumn unitDataGridViewComboBoxColumn;

	private RadioButton TotalPrice_FromExcel_RadioButton;

	private int ctGID;

	private int sType;

	private int sPLU;

	private int sUnit;

	private int sAmount;

	private int sUnitPrice;

	private int sType_Col;

	private int sPLU_Col;

	private int sUnit_Col;

	private int sAmount_Col;

	private int sUnitPrice_Col;

	private int[] typeTable_int;

	private string[] typeTable_string;

	private int step;

	protected override void Dispose(bool disposing)
	{
		if (disposing && components != null)
		{
			components.Dispose();
		}
		base.Dispose(disposing);
	}

	private void InitializeComponent()
	{
		this.components = new System.ComponentModel.Container();
		System.ComponentModel.ComponentResourceManager resources = new System.ComponentModel.ComponentResourceManager(typeof(ECS.StockExcelForm));
		this.uiDataSet = new ECS.UIDataSet();
		this.ecsDataSet = new ECS.ECSDataSet();
		this.pluTableAdapter = new ECS.ECSDataSetTableAdapters.PLUTableAdapter();
		this.Type_ComboBox = new System.Windows.Forms.ComboBox();
		this.Type_FromExcel_NumericUpDown = new System.Windows.Forms.NumericUpDown();
		this.Type_FromExcel_RadioButton = new System.Windows.Forms.RadioButton();
		this.Type_Const_RadioButton = new System.Windows.Forms.RadioButton();
		this.Type_GroupBox = new System.Windows.Forms.GroupBox();
		this.PLU_GroupBox = new System.Windows.Forms.GroupBox();
		this.PLU_FromExcel_RadioButton = new System.Windows.Forms.RadioButton();
		this.PLU_FromExcel_NumericUpDown = new System.Windows.Forms.NumericUpDown();
		this.Unit_GroupBox = new System.Windows.Forms.GroupBox();
		this.Unit_FromPLUUnit_RadioButton = new System.Windows.Forms.RadioButton();
		this.Unit_FromExcel_RadioButton = new System.Windows.Forms.RadioButton();
		this.Unit_FromExcel_NumericUpDown = new System.Windows.Forms.NumericUpDown();
		this.Amount_GroupBox = new System.Windows.Forms.GroupBox();
		this.Amount_FromExcel_RadioButton = new System.Windows.Forms.RadioButton();
		this.Amount_FromExcel_NumericUpDown = new System.Windows.Forms.NumericUpDown();
		this.Price_GroupBox = new System.Windows.Forms.GroupBox();
		this.TotalPrice_FromExcel_RadioButton = new System.Windows.Forms.RadioButton();
		this.UnitPrice_FromZERO_RadioButton = new System.Windows.Forms.RadioButton();
		this.UnitPrice_FromPLUPrice_RadioButton = new System.Windows.Forms.RadioButton();
		this.UnitPrice_FromPLUCost_RadioButton = new System.Windows.Forms.RadioButton();
		this.UnitPrice_FromExcel_RadioButton = new System.Windows.Forms.RadioButton();
		this.UnitPrice_FromExcel_NumericUpDown = new System.Windows.Forms.NumericUpDown();
		this.okButton = new System.Windows.Forms.Button();
		this.cancelButton = new System.Windows.Forms.Button();
		this.se_SplitContainer = new System.Windows.Forms.SplitContainer();
		this.smi_DataGridView = new System.Windows.Forms.DataGridView();
		this.iDDataGridViewTextBoxColumn = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.pLUDataGridViewTextBoxColumn = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.pLUDataGridViewComboBoxColumn = new System.Windows.Forms.DataGridViewComboBoxColumn();
		this.pluBindingSource = new System.Windows.Forms.BindingSource(this.components);
		this.typeDataGridViewTextBoxColumn = new System.Windows.Forms.DataGridViewComboBoxColumn();
		this.unitPriceDataGridViewTextBoxColumn = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.totalPriceDataGridViewTextBoxColumn = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.amountDataGridViewTextBoxColumn = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.unitDataGridViewComboBoxColumn = new System.Windows.Forms.DataGridViewComboBoxColumn();
		this.unitBindingSource = new System.Windows.Forms.BindingSource(this.components);
		this.stockExcelItemBindingSource = new System.Windows.Forms.BindingSource(this.components);
		this.reportDataSet = new ECS.ReportDataSet();
		this.stockMultiItemBindingNavigator = new System.Windows.Forms.BindingNavigator(this.components);
		this.bindingNavigatorAddNewItem = new System.Windows.Forms.ToolStripButton();
		this.bindingNavigatorCountItem = new System.Windows.Forms.ToolStripLabel();
		this.bindingNavigatorDeleteItem = new System.Windows.Forms.ToolStripButton();
		this.bindingNavigatorMoveFirstItem = new System.Windows.Forms.ToolStripButton();
		this.bindingNavigatorMovePreviousItem = new System.Windows.Forms.ToolStripButton();
		this.bindingNavigatorSeparator = new System.Windows.Forms.ToolStripSeparator();
		this.bindingNavigatorPositionItem = new System.Windows.Forms.ToolStripTextBox();
		this.bindingNavigatorSeparator1 = new System.Windows.Forms.ToolStripSeparator();
		this.bindingNavigatorMoveNextItem = new System.Windows.Forms.ToolStripButton();
		this.bindingNavigatorMoveLastItem = new System.Windows.Forms.ToolStripButton();
		this.bindingNavigatorSeparator2 = new System.Windows.Forms.ToolStripSeparator();
		this.stockItemTableAdapter = new ECS.ReportDataSetTableAdapters.StockItemTableAdapter();
		this.logItemTableAdapter = new ECS.ReportDataSetTableAdapters.LogItemTableAdapter();
		this.logTableAdapter = new ECS.ReportDataSetTableAdapters.LogTableAdapter();
		this.sGroupTableAdapter = new ECS.ReportDataSetTableAdapters.SGroupTableAdapter();
		this.deviceTableAdapter = new ECS.ReportDataSetTableAdapters.DeviceTableAdapter();
		this.stockTableAdapter = new ECS.ReportDataSetTableAdapters.StockTableAdapter();
		((System.ComponentModel.ISupportInitialize)this.uiDataSet).BeginInit();
		((System.ComponentModel.ISupportInitialize)this.ecsDataSet).BeginInit();
		((System.ComponentModel.ISupportInitialize)this.Type_FromExcel_NumericUpDown).BeginInit();
		this.Type_GroupBox.SuspendLayout();
		this.PLU_GroupBox.SuspendLayout();
		((System.ComponentModel.ISupportInitialize)this.PLU_FromExcel_NumericUpDown).BeginInit();
		this.Unit_GroupBox.SuspendLayout();
		((System.ComponentModel.ISupportInitialize)this.Unit_FromExcel_NumericUpDown).BeginInit();
		this.Amount_GroupBox.SuspendLayout();
		((System.ComponentModel.ISupportInitialize)this.Amount_FromExcel_NumericUpDown).BeginInit();
		this.Price_GroupBox.SuspendLayout();
		((System.ComponentModel.ISupportInitialize)this.UnitPrice_FromExcel_NumericUpDown).BeginInit();
		this.se_SplitContainer.Panel1.SuspendLayout();
		this.se_SplitContainer.Panel2.SuspendLayout();
		this.se_SplitContainer.SuspendLayout();
		((System.ComponentModel.ISupportInitialize)this.smi_DataGridView).BeginInit();
		((System.ComponentModel.ISupportInitialize)this.pluBindingSource).BeginInit();
		((System.ComponentModel.ISupportInitialize)this.unitBindingSource).BeginInit();
		((System.ComponentModel.ISupportInitialize)this.stockExcelItemBindingSource).BeginInit();
		((System.ComponentModel.ISupportInitialize)this.reportDataSet).BeginInit();
		((System.ComponentModel.ISupportInitialize)this.stockMultiItemBindingNavigator).BeginInit();
		this.stockMultiItemBindingNavigator.SuspendLayout();
		base.SuspendLayout();
		this.uiDataSet.DataSetName = "UIDataSet";
		this.uiDataSet.Locale = new System.Globalization.CultureInfo("zh-CN");
		this.uiDataSet.SchemaSerializationMode = System.Data.SchemaSerializationMode.IncludeSchema;
		this.ecsDataSet.DataSetName = "ECSDataSet";
		this.ecsDataSet.SchemaSerializationMode = System.Data.SchemaSerializationMode.IncludeSchema;
		this.pluTableAdapter.ClearBeforeFill = true;
		this.Type_ComboBox.FormattingEnabled = true;
		resources.ApplyResources(this.Type_ComboBox, "Type_ComboBox");
		this.Type_ComboBox.Name = "Type_ComboBox";
		resources.ApplyResources(this.Type_FromExcel_NumericUpDown, "Type_FromExcel_NumericUpDown");
		this.Type_FromExcel_NumericUpDown.Maximum = new decimal(new int[4] { 999, 0, 0, 0 });
		this.Type_FromExcel_NumericUpDown.Minimum = new decimal(new int[4] { 1, 0, 0, 0 });
		this.Type_FromExcel_NumericUpDown.Name = "Type_FromExcel_NumericUpDown";
		this.Type_FromExcel_NumericUpDown.Value = new decimal(new int[4] { 1, 0, 0, 0 });
		resources.ApplyResources(this.Type_FromExcel_RadioButton, "Type_FromExcel_RadioButton");
		this.Type_FromExcel_RadioButton.Checked = true;
		this.Type_FromExcel_RadioButton.Name = "Type_FromExcel_RadioButton";
		this.Type_FromExcel_RadioButton.TabStop = true;
		this.Type_FromExcel_RadioButton.UseVisualStyleBackColor = true;
		this.Type_FromExcel_RadioButton.CheckedChanged += new System.EventHandler(Type_FromExcel_RadioButton_CheckedChanged);
		resources.ApplyResources(this.Type_Const_RadioButton, "Type_Const_RadioButton");
		this.Type_Const_RadioButton.Name = "Type_Const_RadioButton";
		this.Type_Const_RadioButton.UseVisualStyleBackColor = true;
		this.Type_Const_RadioButton.CheckedChanged += new System.EventHandler(Type_FromExcel_RadioButton_CheckedChanged);
		this.Type_GroupBox.Controls.Add(this.Type_Const_RadioButton);
		this.Type_GroupBox.Controls.Add(this.Type_FromExcel_RadioButton);
		this.Type_GroupBox.Controls.Add(this.Type_FromExcel_NumericUpDown);
		this.Type_GroupBox.Controls.Add(this.Type_ComboBox);
		resources.ApplyResources(this.Type_GroupBox, "Type_GroupBox");
		this.Type_GroupBox.Name = "Type_GroupBox";
		this.Type_GroupBox.TabStop = false;
		this.PLU_GroupBox.Controls.Add(this.PLU_FromExcel_RadioButton);
		this.PLU_GroupBox.Controls.Add(this.PLU_FromExcel_NumericUpDown);
		resources.ApplyResources(this.PLU_GroupBox, "PLU_GroupBox");
		this.PLU_GroupBox.Name = "PLU_GroupBox";
		this.PLU_GroupBox.TabStop = false;
		resources.ApplyResources(this.PLU_FromExcel_RadioButton, "PLU_FromExcel_RadioButton");
		this.PLU_FromExcel_RadioButton.Checked = true;
		this.PLU_FromExcel_RadioButton.Name = "PLU_FromExcel_RadioButton";
		this.PLU_FromExcel_RadioButton.TabStop = true;
		this.PLU_FromExcel_RadioButton.UseVisualStyleBackColor = true;
		this.PLU_FromExcel_RadioButton.CheckedChanged += new System.EventHandler(Type_FromExcel_RadioButton_CheckedChanged);
		resources.ApplyResources(this.PLU_FromExcel_NumericUpDown, "PLU_FromExcel_NumericUpDown");
		this.PLU_FromExcel_NumericUpDown.Maximum = new decimal(new int[4] { 999, 0, 0, 0 });
		this.PLU_FromExcel_NumericUpDown.Minimum = new decimal(new int[4] { 1, 0, 0, 0 });
		this.PLU_FromExcel_NumericUpDown.Name = "PLU_FromExcel_NumericUpDown";
		this.PLU_FromExcel_NumericUpDown.Value = new decimal(new int[4] { 1, 0, 0, 0 });
		this.Unit_GroupBox.Controls.Add(this.Unit_FromPLUUnit_RadioButton);
		this.Unit_GroupBox.Controls.Add(this.Unit_FromExcel_RadioButton);
		this.Unit_GroupBox.Controls.Add(this.Unit_FromExcel_NumericUpDown);
		resources.ApplyResources(this.Unit_GroupBox, "Unit_GroupBox");
		this.Unit_GroupBox.Name = "Unit_GroupBox";
		this.Unit_GroupBox.TabStop = false;
		resources.ApplyResources(this.Unit_FromPLUUnit_RadioButton, "Unit_FromPLUUnit_RadioButton");
		this.Unit_FromPLUUnit_RadioButton.Name = "Unit_FromPLUUnit_RadioButton";
		this.Unit_FromPLUUnit_RadioButton.UseVisualStyleBackColor = true;
		this.Unit_FromPLUUnit_RadioButton.CheckedChanged += new System.EventHandler(Type_FromExcel_RadioButton_CheckedChanged);
		resources.ApplyResources(this.Unit_FromExcel_RadioButton, "Unit_FromExcel_RadioButton");
		this.Unit_FromExcel_RadioButton.Checked = true;
		this.Unit_FromExcel_RadioButton.Name = "Unit_FromExcel_RadioButton";
		this.Unit_FromExcel_RadioButton.TabStop = true;
		this.Unit_FromExcel_RadioButton.UseVisualStyleBackColor = true;
		this.Unit_FromExcel_RadioButton.CheckedChanged += new System.EventHandler(Type_FromExcel_RadioButton_CheckedChanged);
		resources.ApplyResources(this.Unit_FromExcel_NumericUpDown, "Unit_FromExcel_NumericUpDown");
		this.Unit_FromExcel_NumericUpDown.Maximum = new decimal(new int[4] { 999, 0, 0, 0 });
		this.Unit_FromExcel_NumericUpDown.Minimum = new decimal(new int[4] { 1, 0, 0, 0 });
		this.Unit_FromExcel_NumericUpDown.Name = "Unit_FromExcel_NumericUpDown";
		this.Unit_FromExcel_NumericUpDown.Value = new decimal(new int[4] { 1, 0, 0, 0 });
		this.Amount_GroupBox.Controls.Add(this.Amount_FromExcel_RadioButton);
		this.Amount_GroupBox.Controls.Add(this.Amount_FromExcel_NumericUpDown);
		resources.ApplyResources(this.Amount_GroupBox, "Amount_GroupBox");
		this.Amount_GroupBox.Name = "Amount_GroupBox";
		this.Amount_GroupBox.TabStop = false;
		resources.ApplyResources(this.Amount_FromExcel_RadioButton, "Amount_FromExcel_RadioButton");
		this.Amount_FromExcel_RadioButton.Checked = true;
		this.Amount_FromExcel_RadioButton.Name = "Amount_FromExcel_RadioButton";
		this.Amount_FromExcel_RadioButton.TabStop = true;
		this.Amount_FromExcel_RadioButton.UseVisualStyleBackColor = true;
		this.Amount_FromExcel_RadioButton.CheckedChanged += new System.EventHandler(Type_FromExcel_RadioButton_CheckedChanged);
		resources.ApplyResources(this.Amount_FromExcel_NumericUpDown, "Amount_FromExcel_NumericUpDown");
		this.Amount_FromExcel_NumericUpDown.Maximum = new decimal(new int[4] { 999, 0, 0, 0 });
		this.Amount_FromExcel_NumericUpDown.Minimum = new decimal(new int[4] { 1, 0, 0, 0 });
		this.Amount_FromExcel_NumericUpDown.Name = "Amount_FromExcel_NumericUpDown";
		this.Amount_FromExcel_NumericUpDown.Value = new decimal(new int[4] { 1, 0, 0, 0 });
		this.Price_GroupBox.Controls.Add(this.TotalPrice_FromExcel_RadioButton);
		this.Price_GroupBox.Controls.Add(this.UnitPrice_FromZERO_RadioButton);
		this.Price_GroupBox.Controls.Add(this.UnitPrice_FromPLUPrice_RadioButton);
		this.Price_GroupBox.Controls.Add(this.UnitPrice_FromPLUCost_RadioButton);
		this.Price_GroupBox.Controls.Add(this.UnitPrice_FromExcel_RadioButton);
		this.Price_GroupBox.Controls.Add(this.UnitPrice_FromExcel_NumericUpDown);
		resources.ApplyResources(this.Price_GroupBox, "Price_GroupBox");
		this.Price_GroupBox.Name = "Price_GroupBox";
		this.Price_GroupBox.TabStop = false;
		resources.ApplyResources(this.TotalPrice_FromExcel_RadioButton, "TotalPrice_FromExcel_RadioButton");
		this.TotalPrice_FromExcel_RadioButton.Name = "TotalPrice_FromExcel_RadioButton";
		this.TotalPrice_FromExcel_RadioButton.UseVisualStyleBackColor = true;
		this.TotalPrice_FromExcel_RadioButton.CheckedChanged += new System.EventHandler(Type_FromExcel_RadioButton_CheckedChanged);
		resources.ApplyResources(this.UnitPrice_FromZERO_RadioButton, "UnitPrice_FromZERO_RadioButton");
		this.UnitPrice_FromZERO_RadioButton.Name = "UnitPrice_FromZERO_RadioButton";
		this.UnitPrice_FromZERO_RadioButton.UseVisualStyleBackColor = true;
		this.UnitPrice_FromZERO_RadioButton.CheckedChanged += new System.EventHandler(Type_FromExcel_RadioButton_CheckedChanged);
		resources.ApplyResources(this.UnitPrice_FromPLUPrice_RadioButton, "UnitPrice_FromPLUPrice_RadioButton");
		this.UnitPrice_FromPLUPrice_RadioButton.Name = "UnitPrice_FromPLUPrice_RadioButton";
		this.UnitPrice_FromPLUPrice_RadioButton.UseVisualStyleBackColor = true;
		this.UnitPrice_FromPLUPrice_RadioButton.CheckedChanged += new System.EventHandler(Type_FromExcel_RadioButton_CheckedChanged);
		resources.ApplyResources(this.UnitPrice_FromPLUCost_RadioButton, "UnitPrice_FromPLUCost_RadioButton");
		this.UnitPrice_FromPLUCost_RadioButton.Name = "UnitPrice_FromPLUCost_RadioButton";
		this.UnitPrice_FromPLUCost_RadioButton.UseVisualStyleBackColor = true;
		this.UnitPrice_FromPLUCost_RadioButton.CheckedChanged += new System.EventHandler(Type_FromExcel_RadioButton_CheckedChanged);
		resources.ApplyResources(this.UnitPrice_FromExcel_RadioButton, "UnitPrice_FromExcel_RadioButton");
		this.UnitPrice_FromExcel_RadioButton.Checked = true;
		this.UnitPrice_FromExcel_RadioButton.Name = "UnitPrice_FromExcel_RadioButton";
		this.UnitPrice_FromExcel_RadioButton.TabStop = true;
		this.UnitPrice_FromExcel_RadioButton.UseVisualStyleBackColor = true;
		this.UnitPrice_FromExcel_RadioButton.CheckedChanged += new System.EventHandler(Type_FromExcel_RadioButton_CheckedChanged);
		resources.ApplyResources(this.UnitPrice_FromExcel_NumericUpDown, "UnitPrice_FromExcel_NumericUpDown");
		this.UnitPrice_FromExcel_NumericUpDown.Maximum = new decimal(new int[4] { 999, 0, 0, 0 });
		this.UnitPrice_FromExcel_NumericUpDown.Minimum = new decimal(new int[4] { 1, 0, 0, 0 });
		this.UnitPrice_FromExcel_NumericUpDown.Name = "UnitPrice_FromExcel_NumericUpDown";
		this.UnitPrice_FromExcel_NumericUpDown.Value = new decimal(new int[4] { 1, 0, 0, 0 });
		resources.ApplyResources(this.okButton, "okButton");
		this.okButton.Name = "okButton";
		this.okButton.UseVisualStyleBackColor = true;
		this.okButton.Click += new System.EventHandler(okButton_Click);
		resources.ApplyResources(this.cancelButton, "cancelButton");
		this.cancelButton.DialogResult = System.Windows.Forms.DialogResult.Cancel;
		this.cancelButton.Name = "cancelButton";
		this.cancelButton.UseVisualStyleBackColor = true;
		this.se_SplitContainer.BorderStyle = System.Windows.Forms.BorderStyle.Fixed3D;
		resources.ApplyResources(this.se_SplitContainer, "se_SplitContainer");
		this.se_SplitContainer.Name = "se_SplitContainer";
		this.se_SplitContainer.Panel1.Controls.Add(this.Type_GroupBox);
		this.se_SplitContainer.Panel1.Controls.Add(this.Unit_GroupBox);
		this.se_SplitContainer.Panel1.Controls.Add(this.PLU_GroupBox);
		this.se_SplitContainer.Panel1.Controls.Add(this.Price_GroupBox);
		this.se_SplitContainer.Panel1.Controls.Add(this.Amount_GroupBox);
		this.se_SplitContainer.Panel2.Controls.Add(this.smi_DataGridView);
		this.se_SplitContainer.Panel2.Controls.Add(this.stockMultiItemBindingNavigator);
		this.se_SplitContainer.Panel2Collapsed = true;
		this.smi_DataGridView.AllowUserToAddRows = false;
		this.smi_DataGridView.AllowUserToDeleteRows = false;
		this.smi_DataGridView.AutoGenerateColumns = false;
		this.smi_DataGridView.BackgroundColor = System.Drawing.SystemColors.Window;
		this.smi_DataGridView.BorderStyle = System.Windows.Forms.BorderStyle.Fixed3D;
		resources.ApplyResources(this.smi_DataGridView, "smi_DataGridView");
		this.smi_DataGridView.ColumnHeadersHeightSizeMode = System.Windows.Forms.DataGridViewColumnHeadersHeightSizeMode.DisableResizing;
		this.smi_DataGridView.Columns.AddRange(this.iDDataGridViewTextBoxColumn, this.pLUDataGridViewTextBoxColumn, this.pLUDataGridViewComboBoxColumn, this.typeDataGridViewTextBoxColumn, this.unitPriceDataGridViewTextBoxColumn, this.totalPriceDataGridViewTextBoxColumn, this.amountDataGridViewTextBoxColumn, this.unitDataGridViewComboBoxColumn);
		this.smi_DataGridView.DataSource = this.stockExcelItemBindingSource;
		this.smi_DataGridView.Name = "smi_DataGridView";
		this.smi_DataGridView.RowTemplate.Height = 23;
		this.smi_DataGridView.DataError += new System.Windows.Forms.DataGridViewDataErrorEventHandler(smi_DataGridView_DataError);
		this.iDDataGridViewTextBoxColumn.AutoSizeMode = System.Windows.Forms.DataGridViewAutoSizeColumnMode.Fill;
		this.iDDataGridViewTextBoxColumn.DataPropertyName = "ID";
		resources.ApplyResources(this.iDDataGridViewTextBoxColumn, "iDDataGridViewTextBoxColumn");
		this.iDDataGridViewTextBoxColumn.Name = "iDDataGridViewTextBoxColumn";
		this.pLUDataGridViewTextBoxColumn.AutoSizeMode = System.Windows.Forms.DataGridViewAutoSizeColumnMode.Fill;
		this.pLUDataGridViewTextBoxColumn.DataPropertyName = "PLU";
		this.pLUDataGridViewTextBoxColumn.FillWeight = 20f;
		resources.ApplyResources(this.pLUDataGridViewTextBoxColumn, "pLUDataGridViewTextBoxColumn");
		this.pLUDataGridViewTextBoxColumn.Name = "pLUDataGridViewTextBoxColumn";
		this.pLUDataGridViewComboBoxColumn.AutoSizeMode = System.Windows.Forms.DataGridViewAutoSizeColumnMode.Fill;
		this.pLUDataGridViewComboBoxColumn.DataPropertyName = "PLU";
		this.pLUDataGridViewComboBoxColumn.DataSource = this.pluBindingSource;
		this.pLUDataGridViewComboBoxColumn.DisplayMember = "Name";
		this.pLUDataGridViewComboBoxColumn.FillWeight = 40f;
		resources.ApplyResources(this.pLUDataGridViewComboBoxColumn, "pLUDataGridViewComboBoxColumn");
		this.pLUDataGridViewComboBoxColumn.Name = "pLUDataGridViewComboBoxColumn";
		this.pLUDataGridViewComboBoxColumn.ValueMember = "PLUID";
		this.pluBindingSource.DataMember = "PLU";
		this.pluBindingSource.DataSource = this.ecsDataSet;
		this.typeDataGridViewTextBoxColumn.AutoSizeMode = System.Windows.Forms.DataGridViewAutoSizeColumnMode.Fill;
		this.typeDataGridViewTextBoxColumn.DataPropertyName = "Type";
		this.typeDataGridViewTextBoxColumn.FillWeight = 50f;
		resources.ApplyResources(this.typeDataGridViewTextBoxColumn, "typeDataGridViewTextBoxColumn");
		this.typeDataGridViewTextBoxColumn.Name = "typeDataGridViewTextBoxColumn";
		this.typeDataGridViewTextBoxColumn.Resizable = System.Windows.Forms.DataGridViewTriState.True;
		this.typeDataGridViewTextBoxColumn.SortMode = System.Windows.Forms.DataGridViewColumnSortMode.Automatic;
		this.unitPriceDataGridViewTextBoxColumn.AutoSizeMode = System.Windows.Forms.DataGridViewAutoSizeColumnMode.Fill;
		this.unitPriceDataGridViewTextBoxColumn.DataPropertyName = "Unit Price";
		this.unitPriceDataGridViewTextBoxColumn.FillWeight = 30f;
		resources.ApplyResources(this.unitPriceDataGridViewTextBoxColumn, "unitPriceDataGridViewTextBoxColumn");
		this.unitPriceDataGridViewTextBoxColumn.Name = "unitPriceDataGridViewTextBoxColumn";
		this.totalPriceDataGridViewTextBoxColumn.AutoSizeMode = System.Windows.Forms.DataGridViewAutoSizeColumnMode.Fill;
		this.totalPriceDataGridViewTextBoxColumn.DataPropertyName = "Total Price";
		this.totalPriceDataGridViewTextBoxColumn.FillWeight = 30f;
		resources.ApplyResources(this.totalPriceDataGridViewTextBoxColumn, "totalPriceDataGridViewTextBoxColumn");
		this.totalPriceDataGridViewTextBoxColumn.Name = "totalPriceDataGridViewTextBoxColumn";
		this.amountDataGridViewTextBoxColumn.AutoSizeMode = System.Windows.Forms.DataGridViewAutoSizeColumnMode.Fill;
		this.amountDataGridViewTextBoxColumn.DataPropertyName = "Amount";
		this.amountDataGridViewTextBoxColumn.FillWeight = 30f;
		resources.ApplyResources(this.amountDataGridViewTextBoxColumn, "amountDataGridViewTextBoxColumn");
		this.amountDataGridViewTextBoxColumn.Name = "amountDataGridViewTextBoxColumn";
		this.unitDataGridViewComboBoxColumn.AutoSizeMode = System.Windows.Forms.DataGridViewAutoSizeColumnMode.Fill;
		this.unitDataGridViewComboBoxColumn.DataPropertyName = "Unit";
		this.unitDataGridViewComboBoxColumn.DataSource = this.unitBindingSource;
		this.unitDataGridViewComboBoxColumn.DisplayMember = "Name";
		this.unitDataGridViewComboBoxColumn.FillWeight = 20f;
		resources.ApplyResources(this.unitDataGridViewComboBoxColumn, "unitDataGridViewComboBoxColumn");
		this.unitDataGridViewComboBoxColumn.Name = "unitDataGridViewComboBoxColumn";
		this.unitDataGridViewComboBoxColumn.Resizable = System.Windows.Forms.DataGridViewTriState.True;
		this.unitDataGridViewComboBoxColumn.SortMode = System.Windows.Forms.DataGridViewColumnSortMode.Automatic;
		this.unitDataGridViewComboBoxColumn.ValueMember = "UnitID";
		this.unitBindingSource.DataMember = "Unit";
		this.unitBindingSource.DataSource = this.ecsDataSet;
		this.stockExcelItemBindingSource.DataMember = "StockExcelItem";
		this.stockExcelItemBindingSource.DataSource = this.reportDataSet;
		this.stockExcelItemBindingSource.Sort = "";
		this.reportDataSet.DataSetName = "ReportDataSet";
		this.reportDataSet.SchemaSerializationMode = System.Data.SchemaSerializationMode.IncludeSchema;
		this.stockMultiItemBindingNavigator.AddNewItem = this.bindingNavigatorAddNewItem;
		this.stockMultiItemBindingNavigator.BindingSource = this.stockExcelItemBindingSource;
		this.stockMultiItemBindingNavigator.CountItem = this.bindingNavigatorCountItem;
		this.stockMultiItemBindingNavigator.DeleteItem = this.bindingNavigatorDeleteItem;
		this.stockMultiItemBindingNavigator.Items.AddRange(new System.Windows.Forms.ToolStripItem[11]
		{
			this.bindingNavigatorMoveFirstItem, this.bindingNavigatorMovePreviousItem, this.bindingNavigatorSeparator, this.bindingNavigatorPositionItem, this.bindingNavigatorCountItem, this.bindingNavigatorSeparator1, this.bindingNavigatorMoveNextItem, this.bindingNavigatorMoveLastItem, this.bindingNavigatorSeparator2, this.bindingNavigatorAddNewItem,
			this.bindingNavigatorDeleteItem
		});
		resources.ApplyResources(this.stockMultiItemBindingNavigator, "stockMultiItemBindingNavigator");
		this.stockMultiItemBindingNavigator.MoveFirstItem = this.bindingNavigatorMoveFirstItem;
		this.stockMultiItemBindingNavigator.MoveLastItem = this.bindingNavigatorMoveLastItem;
		this.stockMultiItemBindingNavigator.MoveNextItem = this.bindingNavigatorMoveNextItem;
		this.stockMultiItemBindingNavigator.MovePreviousItem = this.bindingNavigatorMovePreviousItem;
		this.stockMultiItemBindingNavigator.Name = "stockMultiItemBindingNavigator";
		this.stockMultiItemBindingNavigator.PositionItem = this.bindingNavigatorPositionItem;
		this.bindingNavigatorAddNewItem.DisplayStyle = System.Windows.Forms.ToolStripItemDisplayStyle.Image;
		resources.ApplyResources(this.bindingNavigatorAddNewItem, "bindingNavigatorAddNewItem");
		this.bindingNavigatorAddNewItem.Name = "bindingNavigatorAddNewItem";
		this.bindingNavigatorCountItem.Name = "bindingNavigatorCountItem";
		resources.ApplyResources(this.bindingNavigatorCountItem, "bindingNavigatorCountItem");
		this.bindingNavigatorDeleteItem.DisplayStyle = System.Windows.Forms.ToolStripItemDisplayStyle.Image;
		resources.ApplyResources(this.bindingNavigatorDeleteItem, "bindingNavigatorDeleteItem");
		this.bindingNavigatorDeleteItem.Name = "bindingNavigatorDeleteItem";
		this.bindingNavigatorMoveFirstItem.DisplayStyle = System.Windows.Forms.ToolStripItemDisplayStyle.Image;
		resources.ApplyResources(this.bindingNavigatorMoveFirstItem, "bindingNavigatorMoveFirstItem");
		this.bindingNavigatorMoveFirstItem.Name = "bindingNavigatorMoveFirstItem";
		this.bindingNavigatorMovePreviousItem.DisplayStyle = System.Windows.Forms.ToolStripItemDisplayStyle.Image;
		resources.ApplyResources(this.bindingNavigatorMovePreviousItem, "bindingNavigatorMovePreviousItem");
		this.bindingNavigatorMovePreviousItem.Name = "bindingNavigatorMovePreviousItem";
		this.bindingNavigatorSeparator.Name = "bindingNavigatorSeparator";
		resources.ApplyResources(this.bindingNavigatorSeparator, "bindingNavigatorSeparator");
		resources.ApplyResources(this.bindingNavigatorPositionItem, "bindingNavigatorPositionItem");
		this.bindingNavigatorPositionItem.Name = "bindingNavigatorPositionItem";
		this.bindingNavigatorSeparator1.Name = "bindingNavigatorSeparator1";
		resources.ApplyResources(this.bindingNavigatorSeparator1, "bindingNavigatorSeparator1");
		this.bindingNavigatorMoveNextItem.DisplayStyle = System.Windows.Forms.ToolStripItemDisplayStyle.Image;
		resources.ApplyResources(this.bindingNavigatorMoveNextItem, "bindingNavigatorMoveNextItem");
		this.bindingNavigatorMoveNextItem.Name = "bindingNavigatorMoveNextItem";
		this.bindingNavigatorMoveLastItem.DisplayStyle = System.Windows.Forms.ToolStripItemDisplayStyle.Image;
		resources.ApplyResources(this.bindingNavigatorMoveLastItem, "bindingNavigatorMoveLastItem");
		this.bindingNavigatorMoveLastItem.Name = "bindingNavigatorMoveLastItem";
		this.bindingNavigatorSeparator2.Name = "bindingNavigatorSeparator2";
		resources.ApplyResources(this.bindingNavigatorSeparator2, "bindingNavigatorSeparator2");
		this.stockItemTableAdapter.ClearBeforeFill = true;
		this.logItemTableAdapter.ClearBeforeFill = true;
		this.logTableAdapter.ClearBeforeFill = true;
		this.sGroupTableAdapter.ClearBeforeFill = true;
		this.deviceTableAdapter.ClearBeforeFill = true;
		this.stockTableAdapter.ClearBeforeFill = true;
		resources.ApplyResources(this, "$this");
		base.AutoScaleMode = System.Windows.Forms.AutoScaleMode.Font;
		base.Controls.Add(this.se_SplitContainer);
		base.Controls.Add(this.okButton);
		base.Controls.Add(this.cancelButton);
		base.FormBorderStyle = System.Windows.Forms.FormBorderStyle.FixedDialog;
		base.MaximizeBox = false;
		base.MinimizeBox = false;
		base.Name = "StockExcelForm";
		base.ShowIcon = false;
		base.ShowInTaskbar = false;
		base.Load += new System.EventHandler(StockExcelForm_Load);
		((System.ComponentModel.ISupportInitialize)this.uiDataSet).EndInit();
		((System.ComponentModel.ISupportInitialize)this.ecsDataSet).EndInit();
		((System.ComponentModel.ISupportInitialize)this.Type_FromExcel_NumericUpDown).EndInit();
		this.Type_GroupBox.ResumeLayout(false);
		this.Type_GroupBox.PerformLayout();
		this.PLU_GroupBox.ResumeLayout(false);
		this.PLU_GroupBox.PerformLayout();
		((System.ComponentModel.ISupportInitialize)this.PLU_FromExcel_NumericUpDown).EndInit();
		this.Unit_GroupBox.ResumeLayout(false);
		this.Unit_GroupBox.PerformLayout();
		((System.ComponentModel.ISupportInitialize)this.Unit_FromExcel_NumericUpDown).EndInit();
		this.Amount_GroupBox.ResumeLayout(false);
		this.Amount_GroupBox.PerformLayout();
		((System.ComponentModel.ISupportInitialize)this.Amount_FromExcel_NumericUpDown).EndInit();
		this.Price_GroupBox.ResumeLayout(false);
		this.Price_GroupBox.PerformLayout();
		((System.ComponentModel.ISupportInitialize)this.UnitPrice_FromExcel_NumericUpDown).EndInit();
		this.se_SplitContainer.Panel1.ResumeLayout(false);
		this.se_SplitContainer.Panel2.ResumeLayout(false);
		this.se_SplitContainer.Panel2.PerformLayout();
		this.se_SplitContainer.ResumeLayout(false);
		((System.ComponentModel.ISupportInitialize)this.smi_DataGridView).EndInit();
		((System.ComponentModel.ISupportInitialize)this.pluBindingSource).EndInit();
		((System.ComponentModel.ISupportInitialize)this.unitBindingSource).EndInit();
		((System.ComponentModel.ISupportInitialize)this.stockExcelItemBindingSource).EndInit();
		((System.ComponentModel.ISupportInitialize)this.reportDataSet).EndInit();
		((System.ComponentModel.ISupportInitialize)this.stockMultiItemBindingNavigator).EndInit();
		this.stockMultiItemBindingNavigator.ResumeLayout(false);
		this.stockMultiItemBindingNavigator.PerformLayout();
		base.ResumeLayout(false);
	}

	public StockExcelForm(int inGID)
	{
		ctGID = inGID;
		InitializeComponent();
	}

	private int typeTable_find(string st)
	{
		st = st.ToLower();
		for (int i = 0; i < typeTable_int.Length && i < typeTable_string.Length; i++)
		{
			if (!(typeTable_string[i] == "") && st == typeTable_string[i])
			{
				return typeTable_int[i];
			}
		}
		return -1;
	}

	private int typeTable_valid(int va)
	{
		for (int i = 0; i < typeTable_int.Length; i++)
		{
			if (va == typeTable_int[i])
			{
				return va;
			}
		}
		return -1;
	}

	private void stepCheck()
	{
		if (step == 0)
		{
			se_SplitContainer.Panel2Collapsed = true;
			okButton.Text = Program.GetLang("pw_ExcelCSVImport");
			return;
		}
		if (sUnitPrice == -2)
		{
			unitPriceDataGridViewTextBoxColumn.Visible = false;
			totalPriceDataGridViewTextBoxColumn.Visible = true;
		}
		else
		{
			unitPriceDataGridViewTextBoxColumn.Visible = true;
			totalPriceDataGridViewTextBoxColumn.Visible = false;
		}
		se_SplitContainer.Panel1Collapsed = true;
		okButton.Text = Program.GetLang("pw_OK");
	}

	private void StockExcelForm_Load(object sender, EventArgs e)
	{
		Text = Program.GetLang("pw_ExcelCSVImport");
		RadioButton type_FromExcel_RadioButton = Type_FromExcel_RadioButton;
		RadioButton unit_FromExcel_RadioButton = Unit_FromExcel_RadioButton;
		RadioButton pLU_FromExcel_RadioButton = PLU_FromExcel_RadioButton;
		string text = (Amount_FromExcel_RadioButton.Text = Program.GetLang("pw_FromExcelColumn"));
		string text2 = (pLU_FromExcel_RadioButton.Text = text);
		string text4 = (unit_FromExcel_RadioButton.Text = text2);
		type_FromExcel_RadioButton.Text = text4;
		UnitPrice_FromExcel_RadioButton.Text = Program.GetLang("pw_UnitPriceFromExcelColumn");
		TotalPrice_FromExcel_RadioButton.Text = Program.GetLang("pw_TotalPriceFromExcelColumn");
		Unit_FromPLUUnit_RadioButton.Text = Program.GetLang("pw_UsePLUUnit");
		UnitPrice_FromPLUPrice_RadioButton.Text = Program.GetLang("pw_UsePLUPrice");
		UnitPrice_FromPLUCost_RadioButton.Text = Program.GetLang("pw_UsePLUCost");
		UnitPrice_FromZERO_RadioButton.Text = Program.GetLang("pw_UseValue0");
		PLU_GroupBox.Text = Program.GetLang("pw_PLUNumber");
		Type_GroupBox.Text = Program.GetLang("pw_Type");
		Unit_GroupBox.Text = Program.GetLang("pw_Unit");
		Price_GroupBox.Text = Program.GetLang("pw_Price");
		Amount_GroupBox.Text = Program.GetLang("pw_Amount");
		cancelButton.Text = Program.GetLang("pw_Cancel");
		pLUDataGridViewTextBoxColumn.HeaderText = Program.GetLang("pw_PLUNo");
		pLUDataGridViewComboBoxColumn.HeaderText = Program.GetLang("pw_PLUName");
		unitDataGridViewComboBoxColumn.HeaderText = Program.GetLang("pw_Unit");
		typeDataGridViewTextBoxColumn.HeaderText = Program.GetLang("pw_Type");
		unitPriceDataGridViewTextBoxColumn.HeaderText = Program.GetLang("pw_UnitPrice");
		totalPriceDataGridViewTextBoxColumn.HeaderText = Program.GetLang("pw_TotalPrice");
		amountDataGridViewTextBoxColumn.HeaderText = Program.GetLang("pw_Amount");
		sGroupTableAdapter.Fill(reportDataSet.SGroup);
		ReportDataSet.SGroupRow sGroupRow = reportDataSet.SGroup.FindByGID(ctGID);
		if (sGroupRow != null)
		{
			Text = $"{Text}({ctGID.ToString()}:{sGroupRow.Name})";
		}
		Font = Settings.Default.CustomFont;
		RDS.DataSet_Init_Unit(ref ecsDataSet);
		pluTableAdapter.Fill(ecsDataSet.PLU);
		stepCheck();
		string fileName = Application.StartupPath + "\\Combo.xml";
		uiDataSet.SimCombo.ReadXml(fileName);
		string[] array = uiDataSet.SimCombo.FindByName("Stock Type Full").ValueDisplay.Split('|');
		int num = 0;
		for (int i = 0; i < array.Length / 2; i++)
		{
			new SimComboVD_No();
			if (int.Parse(array[i * 2]) >= 0 && int.Parse(array[i * 2]) < 100)
			{
				num++;
			}
		}
		SimComboVD_No[] array2 = new SimComboVD_No[num];
		SimComboVD_No[] array3 = new SimComboVD_No[num];
		typeTable_int = new int[num];
		typeTable_string = new string[num];
		num = 0;
		for (int j = 0; j < array.Length / 2; j++)
		{
			int num2 = int.Parse(array[j * 2]);
			if (num2 >= 0 && num2 < 100)
			{
				SimComboVD_No simComboVD_No = new SimComboVD_No();
				simComboVD_No.Value = num2;
				typeTable_int[num] = num2;
				simComboVD_No.Display = array[j * 2 + 1];
				string[] array4 = simComboVD_No.Display.Split('-');
				if (array4.Length >= 2)
				{
					typeTable_string[num] = array4[1].Trim().ToLower();
				}
				else
				{
					typeTable_string[num] = "";
				}
				array2[num] = (array3[num] = simComboVD_No);
				num++;
			}
		}
		Type_ComboBox.ValueMember = "Value";
		Type_ComboBox.DisplayMember = "Display";
		Type_ComboBox.DataSource = array2;
		typeDataGridViewTextBoxColumn.ValueMember = "Value";
		typeDataGridViewTextBoxColumn.DisplayMember = "Display";
		typeDataGridViewTextBoxColumn.DataSource = array3;
		sType = Settings.Default.stockExcel_Type;
		sUnit = Settings.Default.stockExcel_Unit;
		sPLU = Settings.Default.stockExcel_PLU;
		sAmount = Settings.Default.stockExcel_Amount;
		sUnitPrice = Settings.Default.stockExcel_UnitPrice;
		sType_Col = Settings.Default.stockExcel_TypeCol;
		sUnit_Col = Settings.Default.stockExcel_UnitCol;
		sPLU_Col = Settings.Default.stockExcel_PLUCol;
		sAmount_Col = Settings.Default.stockExcel_AmountCol;
		sUnitPrice_Col = Settings.Default.stockExcel_UnitPriceCol;
		GetPara();
		DataGridViewCellStyle defaultCellStyle = totalPriceDataGridViewTextBoxColumn.DefaultCellStyle;
		string format = (unitPriceDataGridViewTextBoxColumn.DefaultCellStyle.Format = "F" + Settings.Default.Format_Price);
		defaultCellStyle.Format = format;
		amountDataGridViewTextBoxColumn.DefaultCellStyle.Format = "F" + Settings.Default.Format_Weight;
		Type_FromExcel_RadioButton_CheckedChanged(null, null);
	}

	private void GetPara()
	{
		Type_FromExcel_NumericUpDown.Value = sType_Col;
		Unit_FromExcel_NumericUpDown.Value = sUnit_Col;
		PLU_FromExcel_NumericUpDown.Value = sPLU_Col;
		Amount_FromExcel_NumericUpDown.Value = sAmount_Col;
		UnitPrice_FromExcel_NumericUpDown.Value = sUnitPrice_Col;
		Type_ComboBox.SelectedValue = Math.Abs(sType);
		if (sType >= 0)
		{
			Type_Const_RadioButton.Checked = true;
		}
		else
		{
			Type_FromExcel_RadioButton.Checked = true;
		}
		if (sUnit >= 0)
		{
			Unit_FromPLUUnit_RadioButton.Checked = true;
		}
		else
		{
			Unit_FromExcel_RadioButton.Checked = true;
		}
		if (sUnitPrice == 0)
		{
			UnitPrice_FromZERO_RadioButton.Checked = true;
		}
		else if (sUnitPrice == 1)
		{
			UnitPrice_FromPLUCost_RadioButton.Checked = true;
		}
		else if (sUnitPrice == 2)
		{
			UnitPrice_FromPLUPrice_RadioButton.Checked = true;
		}
		else if (sUnitPrice == -2)
		{
			TotalPrice_FromExcel_RadioButton.Checked = true;
		}
		else
		{
			UnitPrice_FromExcel_RadioButton.Checked = true;
		}
	}

	private void SetPara()
	{
		sType_Col = (int)Type_FromExcel_NumericUpDown.Value;
		sUnit_Col = (int)Unit_FromExcel_NumericUpDown.Value;
		sPLU_Col = (int)PLU_FromExcel_NumericUpDown.Value;
		sAmount_Col = (int)Amount_FromExcel_NumericUpDown.Value;
		sUnitPrice_Col = (int)UnitPrice_FromExcel_NumericUpDown.Value;
		if (Type_Const_RadioButton.Checked)
		{
			sType = (int)Type_ComboBox.SelectedValue;
		}
		else
		{
			sType = -(int)Type_ComboBox.SelectedValue;
		}
		if (Unit_FromPLUUnit_RadioButton.Checked)
		{
			sUnit = 0;
		}
		else
		{
			sUnit = -1;
		}
		if (UnitPrice_FromZERO_RadioButton.Checked)
		{
			sUnitPrice = 0;
		}
		else if (UnitPrice_FromPLUCost_RadioButton.Checked)
		{
			sUnitPrice = 1;
		}
		else if (UnitPrice_FromPLUPrice_RadioButton.Checked)
		{
			sUnitPrice = 2;
		}
		else if (TotalPrice_FromExcel_RadioButton.Checked)
		{
			sUnitPrice = -2;
		}
		else
		{
			sUnitPrice = -1;
		}
		Settings.Default.stockExcel_Type = sType;
		Settings.Default.stockExcel_Unit = sUnit;
		Settings.Default.stockExcel_PLU = sPLU;
		Settings.Default.stockExcel_Amount = sAmount;
		Settings.Default.stockExcel_UnitPrice = sUnitPrice;
		Settings.Default.stockExcel_TypeCol = sType_Col;
		Settings.Default.stockExcel_UnitCol = sUnit_Col;
		Settings.Default.stockExcel_PLUCol = sPLU_Col;
		Settings.Default.stockExcel_AmountCol = sAmount_Col;
		Settings.Default.stockExcel_UnitPriceCol = sUnitPrice_Col;
		Settings.Default.Save();
	}

	private void Type_FromExcel_RadioButton_CheckedChanged(object sender, EventArgs e)
	{
		if (Unit_FromExcel_RadioButton.Checked)
		{
			RadioButton unitPrice_FromPLUCost_RadioButton = UnitPrice_FromPLUCost_RadioButton;
			bool enabled = (UnitPrice_FromPLUPrice_RadioButton.Enabled = false);
			unitPrice_FromPLUCost_RadioButton.Enabled = enabled;
			if (UnitPrice_FromPLUCost_RadioButton.Checked || UnitPrice_FromPLUPrice_RadioButton.Checked)
			{
				UnitPrice_FromExcel_RadioButton.Checked = true;
			}
		}
		else
		{
			RadioButton unitPrice_FromPLUCost_RadioButton2 = UnitPrice_FromPLUCost_RadioButton;
			bool enabled2 = (UnitPrice_FromPLUPrice_RadioButton.Enabled = true);
			unitPrice_FromPLUCost_RadioButton2.Enabled = enabled2;
		}
		Type_FromExcel_NumericUpDown.Enabled = Type_FromExcel_RadioButton.Checked;
		Type_ComboBox.Enabled = Type_Const_RadioButton.Checked;
		Unit_FromExcel_NumericUpDown.Enabled = Unit_FromExcel_RadioButton.Checked;
		UnitPrice_FromExcel_NumericUpDown.Enabled = UnitPrice_FromExcel_RadioButton.Checked || TotalPrice_FromExcel_RadioButton.Checked;
	}

	private void UploadReport_Log_Error(string Error)
	{
		if (Settings.Default.FXP_Logs_ECS)
		{
			Program.WriteFileLine("LogError.txt", Error);
		}
	}

	private void DataSet_Update(string Type)
	{
		Program.mf.DataSet_Update(Type, "StockMultiItemForm");
	}

	private void okButton_Finish()
	{
		Exception ex = RDS.FK_StockExcel(reportDataSet.StockExcelItem, ctGID, sUnitPrice);
		if (ex != null)
		{
			MessageBox.Show(this, Program.GetLang("pw_Databaseisinuse_") + Environment.NewLine + Environment.NewLine + ex.Message, Program.GetLang("pw_TM_xAManagementProgram") + Resources.Version, MessageBoxButtons.OK, MessageBoxIcon.Hand);
		}
	}

	private void okButton_Click(object sender, EventArgs e)
	{
		if (step == 0)
		{
			try
			{
				SetPara();
				OpenFileDialog openFileDialog = new OpenFileDialog();
				openFileDialog.CheckFileExists = true;
				openFileDialog.Filter = Program.GetLang("pw_Excel_CSVFile___XLS___XLSX___CSV____xls___xlsx___csv");
				if (openFileDialog.ShowDialog(this) == DialogResult.OK && OpenFromExcel(openFileDialog.FileName))
				{
					step = 1;
					stepCheck();
				}
				return;
			}
			catch
			{
				return;
			}
		}
		okButton_Finish();
		base.DialogResult = DialogResult.OK;
	}

	private void OpenFromExcel_Part(OleDbDataReader reader)
	{
		while (reader.Read())
		{
			try
			{
				int num = 0;
				int num2 = 0;
				int num3 = 0;
				decimal value = 0m;
				decimal value2 = 0m;
				decimal value3 = 0m;
				if (sPLU < 0)
				{
					num2 = int.Parse(reader[sPLU_Col - 1].ToString().Trim());
				}
				ECSDataSet.PLURow pLURow = ecsDataSet.PLU.FindByPLUID(num2);
				if (pLURow == null)
				{
					continue;
				}
				if (sType < 0)
				{
					string text = reader[sType_Col - 1].ToString().Trim();
					num = ((!Program.NumberOnly(text)) ? typeTable_find(text) : typeTable_valid(int.Parse(text)));
				}
				else
				{
					num = typeTable_valid(Math.Abs(sType));
				}
				if (num < 0)
				{
					continue;
				}
				if (sUnit < 0)
				{
					string text2 = reader[sUnit_Col - 1].ToString().Trim();
					if (Program.NumberOnly(text2))
					{
						num3 = int.Parse(text2);
					}
					else
					{
						DataRow[] array = ecsDataSet.Unit.Select($"[Name] = '{text2}'");
						if (array.Length > 0)
						{
							num3 = (int)array[0]["UnitID"];
						}
					}
				}
				else
				{
					num3 = pLURow.UnitID;
				}
				if (num3 <= 1 || ecsDataSet.Unit.FindByUnitID(num3) == null)
				{
					num3 = Settings.Default.Report_DefaultWeight;
				}
				if (sAmount < 0)
				{
					value = decimal.Parse(reader[sAmount_Col - 1].ToString().Trim());
				}
				if (sUnitPrice != -2)
				{
					value2 = ((sUnitPrice == 0) ? 0m : ((sUnitPrice == 1) ? pLURow.Cost : ((sUnitPrice != 2) ? decimal.Parse(reader[sUnitPrice_Col - 1].ToString().Trim()) : pLURow.Price)));
				}
				else
				{
					value3 = decimal.Parse(reader[sUnitPrice_Col - 1].ToString().Trim());
				}
				ReportDataSet.StockExcelItemRow stockExcelItemRow = reportDataSet.StockExcelItem.NewStockExcelItemRow();
				stockExcelItemRow.PLU = num2;
				stockExcelItemRow.Type = num;
				stockExcelItemRow.Amount = Math.Abs(value);
				stockExcelItemRow.Unit_Price = Math.Abs(value2);
				stockExcelItemRow.Total_Price = Math.Abs(value3);
				stockExcelItemRow.Unit = num3;
				reportDataSet.StockExcelItem.Rows.Add(stockExcelItemRow);
			}
			catch
			{
			}
		}
	}

	private bool OpenFromExcel(string filename)
	{
		bool flag = true;
		try
		{
			Cursor.Current = Cursors.WaitCursor;
			using (new ECSDataSet())
			{
				if (Path.GetExtension(filename).ToLower().Equals(".xls") || Path.GetExtension(filename).ToLower().Equals(".xlsx"))
				{
					string connectionString = ((!Path.GetExtension(filename).ToLower().Equals(".xls")) ? ("Provider=Microsoft.ACE.OLEDB.12.0;Data Source=" + filename + ";Extended Properties=\"Excel 12.0;HDR=NO;IMEX=1\"") : ("Provider=Microsoft.Jet.OLEDB.4.0;Data Source=" + filename + ";Extended Properties=\"Excel 8.0;HDR=NO;IMEX=1\""));
					using OleDbConnection oleDbConnection = new OleDbConnection(connectionString);
					oleDbConnection.Open();
					DataTable oleDbSchemaTable = oleDbConnection.GetOleDbSchemaTable(OleDbSchemaGuid.Tables, new object[4] { null, null, null, "TABLE" });
					for (int i = 0; i < oleDbSchemaTable.Rows.Count; i++)
					{
						string text = oleDbSchemaTable.Rows[i][2].ToString().Trim();
						if (oleDbSchemaTable.Rows.Count == 1 || text.EndsWith("$") || text.EndsWith("$'"))
						{
							string cmdText = "SELECT * FROM [" + text + "]";
							OleDbCommand oleDbCommand = new OleDbCommand(cmdText, oleDbConnection);
							using OleDbDataReader oleDbDataReader = oleDbCommand.ExecuteReader();
							OpenFromExcel_Part(oleDbDataReader);
							oleDbDataReader.Close();
						}
					}
					oleDbConnection.Close();
				}
				else
				{
					if (!Path.GetExtension(filename).ToLower().Equals(".csv"))
					{
						throw new IOException("Only .xls and .csv allowed");
					}
					string connectionString2 = "Provider=Microsoft.Jet.OLEDB.4.0;Data Source=" + Path.GetDirectoryName(filename) + ";Extended Properties='Text;FMT=Delimited;HDR=NO;IMEX=1;'";
					using OleDbConnection oleDbConnection2 = new OleDbConnection(connectionString2);
					oleDbConnection2.Open();
					OleDbCommand oleDbCommand2 = new OleDbCommand($"SELECT * FROM [{Path.GetFileName(filename)}]", oleDbConnection2);
					using (OleDbDataReader oleDbDataReader2 = oleDbCommand2.ExecuteReader())
					{
						OpenFromExcel_Part(oleDbDataReader2);
						oleDbDataReader2.Close();
					}
					oleDbConnection2.Close();
				}
			}
		}
		catch (Exception ex)
		{
			DialogResult dialogResult = MessageBox.Show(this, Program.GetLang("pw_Error_OperationFailed") + Environment.NewLine + Environment.NewLine + ex.Message, Program.GetLang("pw_TM_xAManagementProgram") + Resources.Version, MessageBoxButtons.OK, MessageBoxIcon.Hand);
			if (dialogResult == DialogResult.OK && ex.Message.Contains("Microsoft.ACE.OLEDB.12.0"))
			{
				string text2 = Program.Config_GetCurrentLang();
				if (text2 == "zh-CHS")
				{
					Process.Start("https://www.microsoft.com/zh-cn/download/details.aspx?id=13255");
				}
				else if (text2 == "zh-CHT")
				{
					Process.Start("https://www.microsoft.com/zh-tw/download/details.aspx?id=13255");
				}
				else
				{
					Process.Start("https://www.microsoft.com/en-us/download/details.aspx?id=13255 ");
				}
			}
			flag = false;
		}
		finally
		{
			Cursor.Current = Cursors.Default;
		}
		if (flag && reportDataSet.StockExcelItem.Count == 0)
		{
			flag = false;
			MessageBox.Show(this, Program.GetLang("pw_Failed_NoValidData") + Environment.NewLine + Environment.NewLine, Program.GetLang("pw_TM_xAManagementProgram") + Resources.Version, MessageBoxButtons.OK, MessageBoxIcon.Hand);
		}
		return flag;
	}

	private void smi_DataGridView_DataError(object sender, DataGridViewDataErrorEventArgs e)
	{
		e.Cancel = true;
	}
}
