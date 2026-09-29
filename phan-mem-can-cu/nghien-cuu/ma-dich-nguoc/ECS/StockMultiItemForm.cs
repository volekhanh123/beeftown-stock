using System;
using System.ComponentModel;
using System.Data;
using System.Drawing;
using System.Globalization;
using System.Windows.Forms;
using ECS.ECSDataSetTableAdapters;
using ECS.Properties;
using ECS.ReportDataSetTableAdapters;

namespace ECS;

public class StockMultiItemForm : Form
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

	private ReportDataSet reportDataSet;

	private BindingSource stockMultiItemBindingSource;

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

	private Panel panel1;

	private RadioButton no0_RadioButton;

	private RadioButton yes0_RadioButton;

	private Button okButton;

	private Button cancelButton;

	private ECSDataSet ecsDataSet;

	private BindingSource pluBindingSource;

	private BindingSource unitBindingSource;

	private DataGridView smi_DataGridView;

	private DeviceTableAdapter deviceTableAdapter;

	private SGroupTableAdapter sGroupTableAdapter;

	private LogTableAdapter logTableAdapter;

	private LogItemTableAdapter logItemTableAdapter;

	private StockItemTableAdapter stockItemTableAdapter;

	private StockTableAdapter stockTableAdapter;

	private PLUTableAdapter pluTableAdapter;

	private BindingSource typeBindingSource;

	private UIDataSet uiDataSet;

	private ToolStripComboBox type_ToolStripComboBox;

	private BindingSource unit2BindingSource;

	private DataGridViewTextBoxColumn pLUDataGridViewTextBoxColumn;

	private DataGridViewComboBoxColumn pLUDataGridViewComboBoxColumn;

	private DataGridViewTextBoxColumn sTakingTimeDataGridViewTextBoxColumn;

	private DataGridViewTextBoxColumn stockDataGridViewTextBoxColumn;

	private DataGridViewTextBoxColumn unitDataGridViewTextBoxColumn;

	private DataGridViewComboBoxColumn unitDataGridViewComboBoxColumn;

	private DataGridViewTextBoxColumn safetyStockDataGridViewTextBoxColumn;

	private DataGridViewCheckBoxColumn lowStockDataGridViewCheckBoxColumn;

	private DataGridViewComboBoxColumn typeDataGridViewTextBoxColumn;

	private DataGridViewTextBoxColumn unitPriceDataGridViewTextBoxColumn;

	private DataGridViewTextBoxColumn amountDataGridViewTextBoxColumn;

	private DataGridViewTextBoxColumn priceInDataGridViewTextBoxColumn;

	private DataGridViewTextBoxColumn priceOutDataGridViewTextBoxColumn;

	private int ctGID;

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
		System.ComponentModel.ComponentResourceManager resources = new System.ComponentModel.ComponentResourceManager(typeof(ECS.StockMultiItemForm));
		this.reportDataSet = new ECS.ReportDataSet();
		this.stockMultiItemBindingNavigator = new System.Windows.Forms.BindingNavigator(this.components);
		this.bindingNavigatorAddNewItem = new System.Windows.Forms.ToolStripButton();
		this.stockMultiItemBindingSource = new System.Windows.Forms.BindingSource(this.components);
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
		this.type_ToolStripComboBox = new System.Windows.Forms.ToolStripComboBox();
		this.panel1 = new System.Windows.Forms.Panel();
		this.smi_DataGridView = new System.Windows.Forms.DataGridView();
		this.pLUDataGridViewTextBoxColumn = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.pLUDataGridViewComboBoxColumn = new System.Windows.Forms.DataGridViewComboBoxColumn();
		this.pluBindingSource = new System.Windows.Forms.BindingSource(this.components);
		this.ecsDataSet = new ECS.ECSDataSet();
		this.sTakingTimeDataGridViewTextBoxColumn = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.stockDataGridViewTextBoxColumn = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.unitDataGridViewTextBoxColumn = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.unitDataGridViewComboBoxColumn = new System.Windows.Forms.DataGridViewComboBoxColumn();
		this.unitBindingSource = new System.Windows.Forms.BindingSource(this.components);
		this.safetyStockDataGridViewTextBoxColumn = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.lowStockDataGridViewCheckBoxColumn = new System.Windows.Forms.DataGridViewCheckBoxColumn();
		this.typeDataGridViewTextBoxColumn = new System.Windows.Forms.DataGridViewComboBoxColumn();
		this.unitPriceDataGridViewTextBoxColumn = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.amountDataGridViewTextBoxColumn = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.priceInDataGridViewTextBoxColumn = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.priceOutDataGridViewTextBoxColumn = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.unit2BindingSource = new System.Windows.Forms.BindingSource(this.components);
		this.no0_RadioButton = new System.Windows.Forms.RadioButton();
		this.yes0_RadioButton = new System.Windows.Forms.RadioButton();
		this.okButton = new System.Windows.Forms.Button();
		this.cancelButton = new System.Windows.Forms.Button();
		this.deviceTableAdapter = new ECS.ReportDataSetTableAdapters.DeviceTableAdapter();
		this.sGroupTableAdapter = new ECS.ReportDataSetTableAdapters.SGroupTableAdapter();
		this.logTableAdapter = new ECS.ReportDataSetTableAdapters.LogTableAdapter();
		this.logItemTableAdapter = new ECS.ReportDataSetTableAdapters.LogItemTableAdapter();
		this.stockItemTableAdapter = new ECS.ReportDataSetTableAdapters.StockItemTableAdapter();
		this.stockTableAdapter = new ECS.ReportDataSetTableAdapters.StockTableAdapter();
		this.pluTableAdapter = new ECS.ECSDataSetTableAdapters.PLUTableAdapter();
		this.typeBindingSource = new System.Windows.Forms.BindingSource(this.components);
		this.uiDataSet = new ECS.UIDataSet();
		((System.ComponentModel.ISupportInitialize)this.reportDataSet).BeginInit();
		((System.ComponentModel.ISupportInitialize)this.stockMultiItemBindingNavigator).BeginInit();
		this.stockMultiItemBindingNavigator.SuspendLayout();
		((System.ComponentModel.ISupportInitialize)this.stockMultiItemBindingSource).BeginInit();
		this.panel1.SuspendLayout();
		((System.ComponentModel.ISupportInitialize)this.smi_DataGridView).BeginInit();
		((System.ComponentModel.ISupportInitialize)this.pluBindingSource).BeginInit();
		((System.ComponentModel.ISupportInitialize)this.ecsDataSet).BeginInit();
		((System.ComponentModel.ISupportInitialize)this.unitBindingSource).BeginInit();
		((System.ComponentModel.ISupportInitialize)this.unit2BindingSource).BeginInit();
		((System.ComponentModel.ISupportInitialize)this.typeBindingSource).BeginInit();
		((System.ComponentModel.ISupportInitialize)this.uiDataSet).BeginInit();
		base.SuspendLayout();
		this.reportDataSet.DataSetName = "ReportDataSet";
		this.reportDataSet.SchemaSerializationMode = System.Data.SchemaSerializationMode.IncludeSchema;
		this.stockMultiItemBindingNavigator.AddNewItem = this.bindingNavigatorAddNewItem;
		this.stockMultiItemBindingNavigator.BindingSource = this.stockMultiItemBindingSource;
		this.stockMultiItemBindingNavigator.CountItem = this.bindingNavigatorCountItem;
		this.stockMultiItemBindingNavigator.DeleteItem = this.bindingNavigatorDeleteItem;
		this.stockMultiItemBindingNavigator.Items.AddRange(new System.Windows.Forms.ToolStripItem[12]
		{
			this.bindingNavigatorMoveFirstItem, this.bindingNavigatorMovePreviousItem, this.bindingNavigatorSeparator, this.bindingNavigatorPositionItem, this.bindingNavigatorCountItem, this.bindingNavigatorSeparator1, this.bindingNavigatorMoveNextItem, this.bindingNavigatorMoveLastItem, this.bindingNavigatorSeparator2, this.bindingNavigatorAddNewItem,
			this.bindingNavigatorDeleteItem, this.type_ToolStripComboBox
		});
		this.stockMultiItemBindingNavigator.Location = new System.Drawing.Point(0, 0);
		this.stockMultiItemBindingNavigator.MoveFirstItem = this.bindingNavigatorMoveFirstItem;
		this.stockMultiItemBindingNavigator.MoveLastItem = this.bindingNavigatorMoveLastItem;
		this.stockMultiItemBindingNavigator.MoveNextItem = this.bindingNavigatorMoveNextItem;
		this.stockMultiItemBindingNavigator.MovePreviousItem = this.bindingNavigatorMovePreviousItem;
		this.stockMultiItemBindingNavigator.Name = "stockMultiItemBindingNavigator";
		this.stockMultiItemBindingNavigator.PositionItem = this.bindingNavigatorPositionItem;
		this.stockMultiItemBindingNavigator.Size = new System.Drawing.Size(847, 25);
		this.stockMultiItemBindingNavigator.TabIndex = 2;
		this.stockMultiItemBindingNavigator.Text = "bindingNavigator1";
		this.bindingNavigatorAddNewItem.DisplayStyle = System.Windows.Forms.ToolStripItemDisplayStyle.Image;
		this.bindingNavigatorAddNewItem.Image = (System.Drawing.Image)resources.GetObject("bindingNavigatorAddNewItem.Image");
		this.bindingNavigatorAddNewItem.Name = "bindingNavigatorAddNewItem";
		this.bindingNavigatorAddNewItem.RightToLeftAutoMirrorImage = true;
		this.bindingNavigatorAddNewItem.Size = new System.Drawing.Size(23, 22);
		this.bindingNavigatorAddNewItem.Text = "新添";
		this.bindingNavigatorAddNewItem.Visible = false;
		this.stockMultiItemBindingSource.DataMember = "StockMultiItem";
		this.stockMultiItemBindingSource.DataSource = this.reportDataSet;
		this.stockMultiItemBindingSource.Sort = "PLU";
		this.bindingNavigatorCountItem.Name = "bindingNavigatorCountItem";
		this.bindingNavigatorCountItem.Size = new System.Drawing.Size(35, 22);
		this.bindingNavigatorCountItem.Text = "/ {0}";
		this.bindingNavigatorDeleteItem.DisplayStyle = System.Windows.Forms.ToolStripItemDisplayStyle.Image;
		this.bindingNavigatorDeleteItem.Image = (System.Drawing.Image)resources.GetObject("bindingNavigatorDeleteItem.Image");
		this.bindingNavigatorDeleteItem.Name = "bindingNavigatorDeleteItem";
		this.bindingNavigatorDeleteItem.RightToLeftAutoMirrorImage = true;
		this.bindingNavigatorDeleteItem.Size = new System.Drawing.Size(23, 22);
		this.bindingNavigatorDeleteItem.Text = "删除";
		this.bindingNavigatorDeleteItem.Visible = false;
		this.bindingNavigatorMoveFirstItem.DisplayStyle = System.Windows.Forms.ToolStripItemDisplayStyle.Image;
		this.bindingNavigatorMoveFirstItem.Image = (System.Drawing.Image)resources.GetObject("bindingNavigatorMoveFirstItem.Image");
		this.bindingNavigatorMoveFirstItem.Name = "bindingNavigatorMoveFirstItem";
		this.bindingNavigatorMoveFirstItem.RightToLeftAutoMirrorImage = true;
		this.bindingNavigatorMoveFirstItem.Size = new System.Drawing.Size(23, 22);
		this.bindingNavigatorMoveFirstItem.Text = "移到第一条记录";
		this.bindingNavigatorMovePreviousItem.DisplayStyle = System.Windows.Forms.ToolStripItemDisplayStyle.Image;
		this.bindingNavigatorMovePreviousItem.Image = (System.Drawing.Image)resources.GetObject("bindingNavigatorMovePreviousItem.Image");
		this.bindingNavigatorMovePreviousItem.Name = "bindingNavigatorMovePreviousItem";
		this.bindingNavigatorMovePreviousItem.RightToLeftAutoMirrorImage = true;
		this.bindingNavigatorMovePreviousItem.Size = new System.Drawing.Size(23, 22);
		this.bindingNavigatorMovePreviousItem.Text = "移到上一条记录";
		this.bindingNavigatorSeparator.Name = "bindingNavigatorSeparator";
		this.bindingNavigatorSeparator.Size = new System.Drawing.Size(6, 25);
		this.bindingNavigatorPositionItem.AccessibleName = "位置";
		this.bindingNavigatorPositionItem.AutoSize = false;
		this.bindingNavigatorPositionItem.Name = "bindingNavigatorPositionItem";
		this.bindingNavigatorPositionItem.Size = new System.Drawing.Size(50, 21);
		this.bindingNavigatorPositionItem.Text = "0";
		this.bindingNavigatorSeparator1.Name = "bindingNavigatorSeparator1";
		this.bindingNavigatorSeparator1.Size = new System.Drawing.Size(6, 25);
		this.bindingNavigatorMoveNextItem.DisplayStyle = System.Windows.Forms.ToolStripItemDisplayStyle.Image;
		this.bindingNavigatorMoveNextItem.Image = (System.Drawing.Image)resources.GetObject("bindingNavigatorMoveNextItem.Image");
		this.bindingNavigatorMoveNextItem.Name = "bindingNavigatorMoveNextItem";
		this.bindingNavigatorMoveNextItem.RightToLeftAutoMirrorImage = true;
		this.bindingNavigatorMoveNextItem.Size = new System.Drawing.Size(23, 22);
		this.bindingNavigatorMoveNextItem.Text = "移到下一条记录";
		this.bindingNavigatorMoveLastItem.DisplayStyle = System.Windows.Forms.ToolStripItemDisplayStyle.Image;
		this.bindingNavigatorMoveLastItem.Image = (System.Drawing.Image)resources.GetObject("bindingNavigatorMoveLastItem.Image");
		this.bindingNavigatorMoveLastItem.Name = "bindingNavigatorMoveLastItem";
		this.bindingNavigatorMoveLastItem.RightToLeftAutoMirrorImage = true;
		this.bindingNavigatorMoveLastItem.Size = new System.Drawing.Size(23, 22);
		this.bindingNavigatorMoveLastItem.Text = "移到最后一条记录";
		this.bindingNavigatorSeparator2.Name = "bindingNavigatorSeparator2";
		this.bindingNavigatorSeparator2.Size = new System.Drawing.Size(6, 25);
		this.type_ToolStripComboBox.Name = "type_ToolStripComboBox";
		this.type_ToolStripComboBox.Size = new System.Drawing.Size(121, 25);
		this.type_ToolStripComboBox.SelectedIndexChanged += new System.EventHandler(type_ToolStripComboBox_SelectedIndexChanged);
		this.type_ToolStripComboBox.Leave += new System.EventHandler(type_ToolStripComboBox_Leave);
		this.panel1.Anchor = System.Windows.Forms.AnchorStyles.Top | System.Windows.Forms.AnchorStyles.Bottom | System.Windows.Forms.AnchorStyles.Left | System.Windows.Forms.AnchorStyles.Right;
		this.panel1.Controls.Add(this.smi_DataGridView);
		this.panel1.Location = new System.Drawing.Point(0, 29);
		this.panel1.Name = "panel1";
		this.panel1.Size = new System.Drawing.Size(847, 400);
		this.panel1.TabIndex = 3;
		this.smi_DataGridView.AllowUserToAddRows = false;
		this.smi_DataGridView.AllowUserToDeleteRows = false;
		this.smi_DataGridView.AutoGenerateColumns = false;
		this.smi_DataGridView.BackgroundColor = System.Drawing.SystemColors.Window;
		this.smi_DataGridView.BorderStyle = System.Windows.Forms.BorderStyle.Fixed3D;
		this.smi_DataGridView.ColumnHeadersHeight = 19;
		this.smi_DataGridView.ColumnHeadersHeightSizeMode = System.Windows.Forms.DataGridViewColumnHeadersHeightSizeMode.DisableResizing;
		this.smi_DataGridView.Columns.AddRange(this.pLUDataGridViewTextBoxColumn, this.pLUDataGridViewComboBoxColumn, this.sTakingTimeDataGridViewTextBoxColumn, this.stockDataGridViewTextBoxColumn, this.unitDataGridViewTextBoxColumn, this.unitDataGridViewComboBoxColumn, this.safetyStockDataGridViewTextBoxColumn, this.lowStockDataGridViewCheckBoxColumn, this.typeDataGridViewTextBoxColumn, this.unitPriceDataGridViewTextBoxColumn, this.amountDataGridViewTextBoxColumn, this.priceInDataGridViewTextBoxColumn, this.priceOutDataGridViewTextBoxColumn);
		this.smi_DataGridView.DataSource = this.stockMultiItemBindingSource;
		this.smi_DataGridView.Dock = System.Windows.Forms.DockStyle.Fill;
		this.smi_DataGridView.Location = new System.Drawing.Point(0, 0);
		this.smi_DataGridView.Name = "smi_DataGridView";
		this.smi_DataGridView.RowHeadersWidth = 20;
		this.smi_DataGridView.RowTemplate.Height = 23;
		this.smi_DataGridView.Size = new System.Drawing.Size(847, 400);
		this.smi_DataGridView.TabIndex = 1;
		this.smi_DataGridView.CellValueChanged += new System.Windows.Forms.DataGridViewCellEventHandler(smi_DataGridView_CellValueChanged);
		this.smi_DataGridView.DataError += new System.Windows.Forms.DataGridViewDataErrorEventHandler(smi_DataGridView_DataError);
		this.pLUDataGridViewTextBoxColumn.AutoSizeMode = System.Windows.Forms.DataGridViewAutoSizeColumnMode.Fill;
		this.pLUDataGridViewTextBoxColumn.DataPropertyName = "PLU";
		this.pLUDataGridViewTextBoxColumn.FillWeight = 30f;
		this.pLUDataGridViewTextBoxColumn.HeaderText = "oPLU Number";
		this.pLUDataGridViewTextBoxColumn.MinimumWidth = 20;
		this.pLUDataGridViewTextBoxColumn.Name = "pLUDataGridViewTextBoxColumn";
		this.pLUDataGridViewTextBoxColumn.ReadOnly = true;
		this.pLUDataGridViewComboBoxColumn.AutoSizeMode = System.Windows.Forms.DataGridViewAutoSizeColumnMode.Fill;
		this.pLUDataGridViewComboBoxColumn.DataPropertyName = "PLU";
		this.pLUDataGridViewComboBoxColumn.DataSource = this.pluBindingSource;
		this.pLUDataGridViewComboBoxColumn.DisplayMember = "Name";
		this.pLUDataGridViewComboBoxColumn.FillWeight = 80f;
		this.pLUDataGridViewComboBoxColumn.HeaderText = "oPLU Name";
		this.pLUDataGridViewComboBoxColumn.MinimumWidth = 40;
		this.pLUDataGridViewComboBoxColumn.Name = "pLUDataGridViewComboBoxColumn";
		this.pLUDataGridViewComboBoxColumn.ReadOnly = true;
		this.pLUDataGridViewComboBoxColumn.Resizable = System.Windows.Forms.DataGridViewTriState.True;
		this.pLUDataGridViewComboBoxColumn.SortMode = System.Windows.Forms.DataGridViewColumnSortMode.Automatic;
		this.pLUDataGridViewComboBoxColumn.ValueMember = "PLUID";
		this.pluBindingSource.DataMember = "PLU";
		this.pluBindingSource.DataSource = this.ecsDataSet;
		this.ecsDataSet.DataSetName = "ECSDataSet";
		this.ecsDataSet.SchemaSerializationMode = System.Data.SchemaSerializationMode.IncludeSchema;
		this.sTakingTimeDataGridViewTextBoxColumn.AutoSizeMode = System.Windows.Forms.DataGridViewAutoSizeColumnMode.Fill;
		this.sTakingTimeDataGridViewTextBoxColumn.DataPropertyName = "STakingTime";
		this.sTakingTimeDataGridViewTextBoxColumn.FillWeight = 80f;
		this.sTakingTimeDataGridViewTextBoxColumn.HeaderText = "oSTakingTime";
		this.sTakingTimeDataGridViewTextBoxColumn.MinimumWidth = 30;
		this.sTakingTimeDataGridViewTextBoxColumn.Name = "sTakingTimeDataGridViewTextBoxColumn";
		this.sTakingTimeDataGridViewTextBoxColumn.ReadOnly = true;
		this.stockDataGridViewTextBoxColumn.AutoSizeMode = System.Windows.Forms.DataGridViewAutoSizeColumnMode.Fill;
		this.stockDataGridViewTextBoxColumn.DataPropertyName = "Stock";
		this.stockDataGridViewTextBoxColumn.FillWeight = 40f;
		this.stockDataGridViewTextBoxColumn.HeaderText = "oStock";
		this.stockDataGridViewTextBoxColumn.MinimumWidth = 30;
		this.stockDataGridViewTextBoxColumn.Name = "stockDataGridViewTextBoxColumn";
		this.stockDataGridViewTextBoxColumn.ReadOnly = true;
		this.unitDataGridViewTextBoxColumn.AutoSizeMode = System.Windows.Forms.DataGridViewAutoSizeColumnMode.Fill;
		this.unitDataGridViewTextBoxColumn.DataPropertyName = "Unit";
		this.unitDataGridViewTextBoxColumn.FillWeight = 30f;
		this.unitDataGridViewTextBoxColumn.HeaderText = "oUnit Number";
		this.unitDataGridViewTextBoxColumn.MinimumWidth = 20;
		this.unitDataGridViewTextBoxColumn.Name = "unitDataGridViewTextBoxColumn";
		this.unitDataGridViewTextBoxColumn.ReadOnly = true;
		this.unitDataGridViewTextBoxColumn.Visible = false;
		this.unitDataGridViewComboBoxColumn.AutoSizeMode = System.Windows.Forms.DataGridViewAutoSizeColumnMode.Fill;
		this.unitDataGridViewComboBoxColumn.DataPropertyName = "Unit";
		this.unitDataGridViewComboBoxColumn.DataSource = this.unitBindingSource;
		this.unitDataGridViewComboBoxColumn.DisplayMember = "Name";
		this.unitDataGridViewComboBoxColumn.FillWeight = 30f;
		this.unitDataGridViewComboBoxColumn.HeaderText = "oUnit";
		this.unitDataGridViewComboBoxColumn.MinimumWidth = 20;
		this.unitDataGridViewComboBoxColumn.Name = "unitDataGridViewComboBoxColumn";
		this.unitDataGridViewComboBoxColumn.ReadOnly = true;
		this.unitDataGridViewComboBoxColumn.Resizable = System.Windows.Forms.DataGridViewTriState.True;
		this.unitDataGridViewComboBoxColumn.SortMode = System.Windows.Forms.DataGridViewColumnSortMode.Automatic;
		this.unitDataGridViewComboBoxColumn.ValueMember = "UnitID";
		this.unitBindingSource.DataMember = "Unit";
		this.unitBindingSource.DataSource = this.ecsDataSet;
		this.safetyStockDataGridViewTextBoxColumn.AutoSizeMode = System.Windows.Forms.DataGridViewAutoSizeColumnMode.Fill;
		this.safetyStockDataGridViewTextBoxColumn.DataPropertyName = "SafetyStock";
		this.safetyStockDataGridViewTextBoxColumn.FillWeight = 40f;
		this.safetyStockDataGridViewTextBoxColumn.HeaderText = "oSafetyStock";
		this.safetyStockDataGridViewTextBoxColumn.MinimumWidth = 20;
		this.safetyStockDataGridViewTextBoxColumn.Name = "safetyStockDataGridViewTextBoxColumn";
		this.lowStockDataGridViewCheckBoxColumn.AutoSizeMode = System.Windows.Forms.DataGridViewAutoSizeColumnMode.Fill;
		this.lowStockDataGridViewCheckBoxColumn.DataPropertyName = "LowStock";
		this.lowStockDataGridViewCheckBoxColumn.FillWeight = 30f;
		this.lowStockDataGridViewCheckBoxColumn.HeaderText = "oLowStock";
		this.lowStockDataGridViewCheckBoxColumn.MinimumWidth = 20;
		this.lowStockDataGridViewCheckBoxColumn.Name = "lowStockDataGridViewCheckBoxColumn";
		this.lowStockDataGridViewCheckBoxColumn.ReadOnly = true;
		this.typeDataGridViewTextBoxColumn.AutoSizeMode = System.Windows.Forms.DataGridViewAutoSizeColumnMode.Fill;
		this.typeDataGridViewTextBoxColumn.DataPropertyName = "Type";
		this.typeDataGridViewTextBoxColumn.FillWeight = 70f;
		this.typeDataGridViewTextBoxColumn.HeaderText = "oType";
		this.typeDataGridViewTextBoxColumn.MinimumWidth = 30;
		this.typeDataGridViewTextBoxColumn.Name = "typeDataGridViewTextBoxColumn";
		this.typeDataGridViewTextBoxColumn.Resizable = System.Windows.Forms.DataGridViewTriState.True;
		this.typeDataGridViewTextBoxColumn.SortMode = System.Windows.Forms.DataGridViewColumnSortMode.Automatic;
		this.unitPriceDataGridViewTextBoxColumn.AutoSizeMode = System.Windows.Forms.DataGridViewAutoSizeColumnMode.Fill;
		this.unitPriceDataGridViewTextBoxColumn.DataPropertyName = "Unit Price";
		this.unitPriceDataGridViewTextBoxColumn.FillWeight = 50f;
		this.unitPriceDataGridViewTextBoxColumn.HeaderText = "oUnitPrice";
		this.unitPriceDataGridViewTextBoxColumn.MinimumWidth = 30;
		this.unitPriceDataGridViewTextBoxColumn.Name = "unitPriceDataGridViewTextBoxColumn";
		this.amountDataGridViewTextBoxColumn.AutoSizeMode = System.Windows.Forms.DataGridViewAutoSizeColumnMode.Fill;
		this.amountDataGridViewTextBoxColumn.DataPropertyName = "Amount";
		this.amountDataGridViewTextBoxColumn.FillWeight = 40f;
		this.amountDataGridViewTextBoxColumn.HeaderText = "oAmount";
		this.amountDataGridViewTextBoxColumn.MinimumWidth = 30;
		this.amountDataGridViewTextBoxColumn.Name = "amountDataGridViewTextBoxColumn";
		this.priceInDataGridViewTextBoxColumn.DataPropertyName = "PriceIn";
		this.priceInDataGridViewTextBoxColumn.HeaderText = "oPriceIn";
		this.priceInDataGridViewTextBoxColumn.Name = "priceInDataGridViewTextBoxColumn";
		this.priceInDataGridViewTextBoxColumn.Visible = false;
		this.priceOutDataGridViewTextBoxColumn.DataPropertyName = "PriceOut";
		this.priceOutDataGridViewTextBoxColumn.HeaderText = "oPriceOut";
		this.priceOutDataGridViewTextBoxColumn.Name = "priceOutDataGridViewTextBoxColumn";
		this.priceOutDataGridViewTextBoxColumn.Visible = false;
		this.unit2BindingSource.DataMember = "Unit";
		this.unit2BindingSource.DataSource = this.ecsDataSet;
		this.no0_RadioButton.AutoSize = true;
		this.no0_RadioButton.Checked = true;
		this.no0_RadioButton.Location = new System.Drawing.Point(26, 448);
		this.no0_RadioButton.Name = "no0_RadioButton";
		this.no0_RadioButton.Size = new System.Drawing.Size(155, 16);
		this.no0_RadioButton.TabIndex = 4;
		this.no0_RadioButton.TabStop = true;
		this.no0_RadioButton.Text = "oRemove Zero Data Item";
		this.no0_RadioButton.UseVisualStyleBackColor = true;
		this.yes0_RadioButton.AutoSize = true;
		this.yes0_RadioButton.Location = new System.Drawing.Point(293, 448);
		this.yes0_RadioButton.Name = "yes0_RadioButton";
		this.yes0_RadioButton.Size = new System.Drawing.Size(143, 16);
		this.yes0_RadioButton.TabIndex = 4;
		this.yes0_RadioButton.Text = "oKeep Zero Data Item";
		this.yes0_RadioButton.UseVisualStyleBackColor = true;
		this.okButton.DialogResult = System.Windows.Forms.DialogResult.OK;
		this.okButton.ImeMode = System.Windows.Forms.ImeMode.NoControl;
		this.okButton.Location = new System.Drawing.Point(575, 445);
		this.okButton.Name = "okButton";
		this.okButton.Size = new System.Drawing.Size(119, 23);
		this.okButton.TabIndex = 5;
		this.okButton.Text = "okButton";
		this.okButton.UseVisualStyleBackColor = true;
		this.okButton.Click += new System.EventHandler(okButton_Click);
		this.cancelButton.DialogResult = System.Windows.Forms.DialogResult.Cancel;
		this.cancelButton.ImeMode = System.Windows.Forms.ImeMode.NoControl;
		this.cancelButton.Location = new System.Drawing.Point(712, 445);
		this.cancelButton.Name = "cancelButton";
		this.cancelButton.Size = new System.Drawing.Size(119, 23);
		this.cancelButton.TabIndex = 6;
		this.cancelButton.Text = "cancelButton";
		this.cancelButton.UseVisualStyleBackColor = true;
		this.deviceTableAdapter.ClearBeforeFill = true;
		this.sGroupTableAdapter.ClearBeforeFill = true;
		this.logTableAdapter.ClearBeforeFill = true;
		this.logItemTableAdapter.ClearBeforeFill = true;
		this.stockItemTableAdapter.ClearBeforeFill = true;
		this.stockTableAdapter.ClearBeforeFill = true;
		this.pluTableAdapter.ClearBeforeFill = true;
		this.typeBindingSource.DataMember = "Unit";
		this.typeBindingSource.DataSource = this.ecsDataSet;
		this.uiDataSet.DataSetName = "UIDataSet";
		this.uiDataSet.Locale = new System.Globalization.CultureInfo("zh-CN");
		this.uiDataSet.SchemaSerializationMode = System.Data.SchemaSerializationMode.IncludeSchema;
		base.AutoScaleDimensions = new System.Drawing.SizeF(6f, 12f);
		base.AutoScaleMode = System.Windows.Forms.AutoScaleMode.Font;
		base.ClientSize = new System.Drawing.Size(847, 483);
		base.Controls.Add(this.okButton);
		base.Controls.Add(this.cancelButton);
		base.Controls.Add(this.yes0_RadioButton);
		base.Controls.Add(this.no0_RadioButton);
		base.Controls.Add(this.panel1);
		base.Controls.Add(this.stockMultiItemBindingNavigator);
		base.FormBorderStyle = System.Windows.Forms.FormBorderStyle.FixedDialog;
		base.MaximizeBox = false;
		base.MinimizeBox = false;
		base.Name = "StockMultiItemForm";
		base.ShowIcon = false;
		base.ShowInTaskbar = false;
		base.StartPosition = System.Windows.Forms.FormStartPosition.CenterParent;
		this.Text = "StockMultiItem";
		base.Load += new System.EventHandler(StockMultiItem_Load);
		((System.ComponentModel.ISupportInitialize)this.reportDataSet).EndInit();
		((System.ComponentModel.ISupportInitialize)this.stockMultiItemBindingNavigator).EndInit();
		this.stockMultiItemBindingNavigator.ResumeLayout(false);
		this.stockMultiItemBindingNavigator.PerformLayout();
		((System.ComponentModel.ISupportInitialize)this.stockMultiItemBindingSource).EndInit();
		this.panel1.ResumeLayout(false);
		((System.ComponentModel.ISupportInitialize)this.smi_DataGridView).EndInit();
		((System.ComponentModel.ISupportInitialize)this.pluBindingSource).EndInit();
		((System.ComponentModel.ISupportInitialize)this.ecsDataSet).EndInit();
		((System.ComponentModel.ISupportInitialize)this.unitBindingSource).EndInit();
		((System.ComponentModel.ISupportInitialize)this.unit2BindingSource).EndInit();
		((System.ComponentModel.ISupportInitialize)this.typeBindingSource).EndInit();
		((System.ComponentModel.ISupportInitialize)this.uiDataSet).EndInit();
		base.ResumeLayout(false);
		base.PerformLayout();
	}

	public StockMultiItemForm(int inGID)
	{
		ctGID = inGID;
		InitializeComponent();
	}

	private void StockMultiItem_Load(object sender, EventArgs e)
	{
		pLUDataGridViewTextBoxColumn.HeaderText = Program.GetLang("pw_PLUNo");
		pLUDataGridViewComboBoxColumn.HeaderText = Program.GetLang("pw_PLUName");
		sTakingTimeDataGridViewTextBoxColumn.HeaderText = Program.GetLang("pw_LastStocktaking");
		stockDataGridViewTextBoxColumn.HeaderText = Program.GetLang("pw_AmountInStock");
		unitDataGridViewTextBoxColumn.HeaderText = Program.GetLang("pw_UnitNo");
		unitDataGridViewComboBoxColumn.HeaderText = Program.GetLang("pw_Unit");
		safetyStockDataGridViewTextBoxColumn.HeaderText = Program.GetLang("pw_SafetyStock");
		lowStockDataGridViewCheckBoxColumn.HeaderText = Program.GetLang("pw_LowStock");
		typeDataGridViewTextBoxColumn.HeaderText = Program.GetLang("pw_Type");
		unitPriceDataGridViewTextBoxColumn.HeaderText = Program.GetLang("pw_UnitPrice");
		amountDataGridViewTextBoxColumn.HeaderText = Program.GetLang("pw_Amount");
		cancelButton.Text = Program.GetLang("pw_Cancel");
		okButton.Text = Program.GetLang("pw_OK");
		yes0_RadioButton.Text = Program.GetLang("pw_KeepZeroDataItem");
		no0_RadioButton.Text = Program.GetLang("pw_RemoveZeroDataItem");
		bindingNavigatorMoveFirstItem.Text = Program.GetLang("pw_FirstRecord");
		bindingNavigatorMoveLastItem.Text = Program.GetLang("pw_LastRecord");
		bindingNavigatorMoveNextItem.Text = Program.GetLang("pw_NextRecord");
		bindingNavigatorMovePreviousItem.Text = Program.GetLang("pw_PreviousRecord");
		Font = Settings.Default.CustomFont;
		Text = Program.GetLang("pw_MultiStockItem");
		sGroupTableAdapter.Fill(reportDataSet.SGroup);
		ReportDataSet.SGroupRow sGroupRow = reportDataSet.SGroup.FindByGID(ctGID);
		if (sGroupRow != null)
		{
			Text = $"{Text}({ctGID.ToString()}:{sGroupRow.Name})";
		}
		RDS.DataSet_Init_Unit(ref ecsDataSet);
		pluTableAdapter.Fill(ecsDataSet.PLU);
		Program.GetStockMultiItem(ref reportDataSet, ecsDataSet, ctGID);
		string fileName = Application.StartupPath + "\\Combo.xml";
		uiDataSet.SimCombo.ReadXml(fileName);
		string[] array = uiDataSet.SimCombo.FindByName("Stock Type Full").ValueDisplay.Split('|');
		int num = 0;
		for (int i = 0; i < array.Length / 2; i++)
		{
			if ((int.Parse(array[i * 2]) >= 0 && int.Parse(array[i * 2]) < 100) || int.Parse(array[i * 2]) < 0)
			{
				num++;
			}
		}
		SimComboVD_No[] array2 = new SimComboVD_No[num];
		SimComboVD_No[] array3 = new SimComboVD_No[num];
		num = 0;
		for (int j = 0; j < array.Length / 2; j++)
		{
			int num2 = int.Parse(array[j * 2]);
			if ((num2 >= 0 && num2 < 100) || num2 < 0)
			{
				SimComboVD_No simComboVD_No = new SimComboVD_No();
				simComboVD_No.Value = num2;
				simComboVD_No.Display = array[j * 2 + 1];
				simComboVD_No.Display.Split('-');
				array2[num] = (array3[num] = simComboVD_No);
				num++;
			}
		}
		typeDataGridViewTextBoxColumn.ValueMember = "Value";
		typeDataGridViewTextBoxColumn.DisplayMember = "Display";
		typeDataGridViewTextBoxColumn.DataSource = array2;
		type_ToolStripComboBox.ComboBox.ValueMember = "Value";
		type_ToolStripComboBox.ComboBox.DisplayMember = "Display";
		type_ToolStripComboBox.ComboBox.DataSource = array3;
		DataGridViewCellStyle defaultCellStyle = priceInDataGridViewTextBoxColumn.DefaultCellStyle;
		DataGridViewCellStyle defaultCellStyle2 = priceOutDataGridViewTextBoxColumn.DefaultCellStyle;
		string text = (unitPriceDataGridViewTextBoxColumn.DefaultCellStyle.Format = "F" + Settings.Default.Format_Price);
		string format = (defaultCellStyle2.Format = text);
		defaultCellStyle.Format = format;
		DataGridViewCellStyle defaultCellStyle3 = safetyStockDataGridViewTextBoxColumn.DefaultCellStyle;
		DataGridViewCellStyle defaultCellStyle4 = stockDataGridViewTextBoxColumn.DefaultCellStyle;
		string text4 = (amountDataGridViewTextBoxColumn.DefaultCellStyle.Format = "F" + Settings.Default.Format_Weight);
		string format2 = (defaultCellStyle4.Format = text4);
		defaultCellStyle3.Format = format2;
		sTakingTimeDataGridViewTextBoxColumn.DefaultCellStyle.Format = "yyyy-MM-dd HH:mm:ss";
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

	private void okButton_Click(object sender, EventArgs e)
	{
		Exception ex = RDS.FK_StockMultiItem(reportDataSet.StockMultiItem, ctGID, yes0_RadioButton.Checked);
		if (ex != null)
		{
			MessageBox.Show(this, Program.GetLang("pw_Databaseisinuse_") + Environment.NewLine + Environment.NewLine + ex.Message, Program.GetLang("pw_TM_xAManagementProgram") + Resources.Version, MessageBoxButtons.OK, MessageBoxIcon.Hand);
		}
	}

	private void smi_DataGridView_CellValueChanged(object sender, DataGridViewCellEventArgs e)
	{
		if (e.ColumnIndex < 0 || e.RowIndex < 0)
		{
			return;
		}
		if (e.ColumnIndex == 8)
		{
			switch ((int)((DataGridView)sender).CurrentRow.Cells[e.ColumnIndex].Value)
			{
			case 0:
			case 1:
				((DataGridView)sender).CurrentRow.Cells[9].Value = ((DataGridView)sender).CurrentRow.Cells[12].Value;
				break;
			case 10:
			case 11:
			{
				DataRow[] array2 = RDS.eCSDataSet.CoPLU_ProMat.Select($"[PLUID_Product] = '{((DataGridView)sender).CurrentRow.Cells[0].Value}'");
				if (array2.Length != 0)
				{
					((DataGridView)sender).CurrentRow.Cells[e.ColumnIndex].Value = -1;
				}
				else
				{
					((DataGridView)sender).CurrentRow.Cells[9].Value = ((DataGridView)sender).CurrentRow.Cells[11].Value;
				}
				break;
			}
			default:
			{
				DataRow[] array = RDS.eCSDataSet.CoPLU_ProMat.Select($"[PLUID_Product] = '{((DataGridView)sender).CurrentRow.Cells[0].Value}'");
				if (array.Length != 0)
				{
					((DataGridView)sender).CurrentRow.Cells[e.ColumnIndex].Value = -1;
				}
				else
				{
					((DataGridView)sender).CurrentRow.Cells[9].Value = 0;
				}
				break;
			}
			}
		}
		else if (e.ColumnIndex == 6)
		{
			((DataGridView)sender).CurrentRow.Cells[7].Value = (int)((DataGridView)sender).CurrentRow.Cells[4].Value < (int)((DataGridView)sender).CurrentRow.Cells[6].Value;
		}
		else if (e.ColumnIndex == 9)
		{
			decimal num = (decimal)((DataGridView)sender).CurrentRow.Cells[9].Value;
			if (num < 0m)
			{
				num = 0m;
			}
			int num2 = (int)((DataGridView)sender).CurrentRow.Cells[8].Value;
			if (num2 >= 112)
			{
				num = 0m;
			}
			((DataGridView)sender).CurrentRow.Cells[9].Value = num;
		}
		else if (e.ColumnIndex == 10)
		{
			decimal num3 = (decimal)((DataGridView)sender).CurrentRow.Cells[10].Value;
			if (num3 < 0m)
			{
				num3 = 0m;
			}
			_ = (int)((DataGridView)sender).CurrentRow.Cells[8].Value;
			((DataGridView)sender).CurrentRow.Cells[10].Value = num3;
		}
	}

	private void smi_DataGridView_DataError(object sender, DataGridViewDataErrorEventArgs e)
	{
		e.Cancel = true;
	}

	private void type_ToolStripComboBox_Leave(object sender, EventArgs e)
	{
		if (type_ToolStripComboBox.ComboBox.SelectedIndex >= 0)
		{
			return;
		}
		for (int i = 0; i < type_ToolStripComboBox.ComboBox.Items.Count; i++)
		{
			if (((SimComboVD_No)type_ToolStripComboBox.ComboBox.Items[i]).Display == type_ToolStripComboBox.Text)
			{
				type_ToolStripComboBox.ComboBox.SelectedValue = ((SimComboVD_No)type_ToolStripComboBox.ComboBox.Items[i]).Value;
				return;
			}
		}
		type_ToolStripComboBox.ComboBox.SelectedValue = -1;
	}

	private void type_ToolStripComboBox_SelectedIndexChanged(object sender, EventArgs e)
	{
		foreach (ReportDataSet.StockMultiItemRow item in reportDataSet.StockMultiItem)
		{
			int num = (int)type_ToolStripComboBox.ComboBox.SelectedValue;
			if (num < 0)
			{
				if (item.Amount == 0m)
				{
					item.Type = -1;
				}
			}
			else
			{
				if (item.Type >= 0 && !(item.Amount == 0m))
				{
					continue;
				}
				item.Type = num;
				switch (num)
				{
				case 0:
				case 1:
					item.Unit_Price = item.PriceOut;
					break;
				case 10:
				case 11:
				{
					DataRow[] array2 = RDS.eCSDataSet.CoPLU_ProMat.Select($"[PLUID_Product] = '{item.PLU}'");
					if (array2.Length != 0)
					{
						item.Type = -1;
					}
					else
					{
						item.Unit_Price = item.PriceIn;
					}
					break;
				}
				default:
				{
					DataRow[] array = RDS.eCSDataSet.CoPLU_ProMat.Select($"[PLUID_Product] = '{item.PLU}'");
					if (array.Length != 0)
					{
						item.Type = -1;
					}
					else
					{
						item.Unit_Price = 0m;
					}
					break;
				}
				}
			}
		}
	}
}
