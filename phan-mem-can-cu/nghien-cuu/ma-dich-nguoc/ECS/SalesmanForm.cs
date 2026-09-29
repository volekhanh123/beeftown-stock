using System;
using System.ComponentModel;
using System.Data;
using System.Drawing;
using System.Windows.Forms;
using ECS.ECSDataSetTableAdapters;
using ECS.Properties;

namespace ECS;

public class SalesmanForm : Form
{
	private delegate void DataSet_RefreshCallback(string Type);

	private IContainer components;

	private ECSDataSet eCSDataSet;

	private BindingSource salesmanBindingSource;

	private SalesmanTableAdapter salesmanTableAdapter;

	private BindingNavigator salesmanBindingNavigator;

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

	private SplitContainer splitContainer;

	private DataGridView salesmanDataGridView;

	private TextBox nameTextBox;

	private NumericUpDown salesmanIDNumericUpDown;

	private ToolStripSeparator toolStripSeparator1;

	private ToolStripTextBox bindingNavigatorID;

	private ToolStripButton bindingNavigatorGoto;

	private ToolStripButton bindingNavigatorFilter;

	private TextBox passwordTextBox;

	private ToolStripButton P0_TMSFile_toolStripButton;

	private ToolStripButton P0_Ethernet_toolStripButton;

	private NumericUpDown discountlowNumericUpDown;

	private NumericUpDown rightfbNumericUpDown;

	private NumericUpDown discounthighNumericUpDown;

	private GroupBox rightfb_GroupBox;

	private CheckBox FProgPrice_CheckBox;

	private CheckBox TSaleWT_CheckBox;

	private CheckBox TSaleCT_CheckBox;

	private CheckBox Reprint_CheckBox;

	private CheckBox HangupWrite_CheckBox;

	private CheckBox Drawer_CheckBox;

	private CheckBox Amend_CheckBox;

	private CheckBox ItemQuit_CheckBox;

	private TextBox codeTextBox;

	private CheckBox Preprint_CheckBox;

	private DataGridViewTextBoxColumn dataGridViewTextBoxColumn1;

	private DataGridViewTextBoxColumn dataGridViewTextBoxColumn2;

	private DataGridViewTextBoxColumn discountlowdataGridViewTextBoxColumn;

	private DataGridViewTextBoxColumn discounthighdataGridViewTextBoxColumn;

	private DataGridViewTextBoxColumn codedataGridViewTextBoxColumn;

	private CheckBox BuyBack_CheckBox;

	private CheckBox HangupRead_CheckBox;

	private Label nameLabel;

	private Label passwordLabel;

	private Label priceChangeInfo_Label;

	private Label codeLabel;

	private Label rightfb_Label;

	private Label discountHigh_Label;

	private Label discountLow_Label;

	private Label salesmanIDLabel;

	private CheckBox IllegalReboot_CheckBox;

	private bool NoCTRowChanged;

	private bool DataSet_Changed;

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
		System.ComponentModel.ComponentResourceManager resources = new System.ComponentModel.ComponentResourceManager(typeof(ECS.SalesmanForm));
		this.splitContainer = new System.Windows.Forms.SplitContainer();
		this.salesmanDataGridView = new System.Windows.Forms.DataGridView();
		this.dataGridViewTextBoxColumn1 = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.dataGridViewTextBoxColumn2 = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.discountlowdataGridViewTextBoxColumn = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.discounthighdataGridViewTextBoxColumn = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.codedataGridViewTextBoxColumn = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.salesmanBindingSource = new System.Windows.Forms.BindingSource(this.components);
		this.eCSDataSet = new ECS.ECSDataSet();
		this.rightfb_GroupBox = new System.Windows.Forms.GroupBox();
		this.IllegalReboot_CheckBox = new System.Windows.Forms.CheckBox();
		this.BuyBack_CheckBox = new System.Windows.Forms.CheckBox();
		this.FProgPrice_CheckBox = new System.Windows.Forms.CheckBox();
		this.TSaleWT_CheckBox = new System.Windows.Forms.CheckBox();
		this.TSaleCT_CheckBox = new System.Windows.Forms.CheckBox();
		this.Preprint_CheckBox = new System.Windows.Forms.CheckBox();
		this.Reprint_CheckBox = new System.Windows.Forms.CheckBox();
		this.HangupRead_CheckBox = new System.Windows.Forms.CheckBox();
		this.HangupWrite_CheckBox = new System.Windows.Forms.CheckBox();
		this.Drawer_CheckBox = new System.Windows.Forms.CheckBox();
		this.Amend_CheckBox = new System.Windows.Forms.CheckBox();
		this.ItemQuit_CheckBox = new System.Windows.Forms.CheckBox();
		this.passwordLabel = new System.Windows.Forms.Label();
		this.passwordTextBox = new System.Windows.Forms.TextBox();
		this.priceChangeInfo_Label = new System.Windows.Forms.Label();
		this.codeLabel = new System.Windows.Forms.Label();
		this.rightfb_Label = new System.Windows.Forms.Label();
		this.discountHigh_Label = new System.Windows.Forms.Label();
		this.discountLow_Label = new System.Windows.Forms.Label();
		this.salesmanIDLabel = new System.Windows.Forms.Label();
		this.rightfbNumericUpDown = new System.Windows.Forms.NumericUpDown();
		this.discounthighNumericUpDown = new System.Windows.Forms.NumericUpDown();
		this.discountlowNumericUpDown = new System.Windows.Forms.NumericUpDown();
		this.salesmanIDNumericUpDown = new System.Windows.Forms.NumericUpDown();
		this.nameLabel = new System.Windows.Forms.Label();
		this.codeTextBox = new System.Windows.Forms.TextBox();
		this.nameTextBox = new System.Windows.Forms.TextBox();
		this.salesmanBindingNavigator = new System.Windows.Forms.BindingNavigator(this.components);
		this.bindingNavigatorAddNewItem = new System.Windows.Forms.ToolStripButton();
		this.bindingNavigatorCountItem = new System.Windows.Forms.ToolStripLabel();
		this.bindingNavigatorMoveFirstItem = new System.Windows.Forms.ToolStripButton();
		this.bindingNavigatorMovePreviousItem = new System.Windows.Forms.ToolStripButton();
		this.bindingNavigatorSeparator = new System.Windows.Forms.ToolStripSeparator();
		this.bindingNavigatorPositionItem = new System.Windows.Forms.ToolStripTextBox();
		this.bindingNavigatorSeparator1 = new System.Windows.Forms.ToolStripSeparator();
		this.bindingNavigatorMoveNextItem = new System.Windows.Forms.ToolStripButton();
		this.bindingNavigatorMoveLastItem = new System.Windows.Forms.ToolStripButton();
		this.bindingNavigatorSeparator2 = new System.Windows.Forms.ToolStripSeparator();
		this.bindingNavigatorDeleteItem = new System.Windows.Forms.ToolStripButton();
		this.toolStripSeparator1 = new System.Windows.Forms.ToolStripSeparator();
		this.bindingNavigatorID = new System.Windows.Forms.ToolStripTextBox();
		this.bindingNavigatorGoto = new System.Windows.Forms.ToolStripButton();
		this.bindingNavigatorFilter = new System.Windows.Forms.ToolStripButton();
		this.P0_TMSFile_toolStripButton = new System.Windows.Forms.ToolStripButton();
		this.P0_Ethernet_toolStripButton = new System.Windows.Forms.ToolStripButton();
		this.salesmanTableAdapter = new ECS.ECSDataSetTableAdapters.SalesmanTableAdapter();
		this.splitContainer.Panel1.SuspendLayout();
		this.splitContainer.Panel2.SuspendLayout();
		this.splitContainer.SuspendLayout();
		((System.ComponentModel.ISupportInitialize)this.salesmanDataGridView).BeginInit();
		((System.ComponentModel.ISupportInitialize)this.salesmanBindingSource).BeginInit();
		((System.ComponentModel.ISupportInitialize)this.eCSDataSet).BeginInit();
		this.rightfb_GroupBox.SuspendLayout();
		((System.ComponentModel.ISupportInitialize)this.rightfbNumericUpDown).BeginInit();
		((System.ComponentModel.ISupportInitialize)this.discounthighNumericUpDown).BeginInit();
		((System.ComponentModel.ISupportInitialize)this.discountlowNumericUpDown).BeginInit();
		((System.ComponentModel.ISupportInitialize)this.salesmanIDNumericUpDown).BeginInit();
		((System.ComponentModel.ISupportInitialize)this.salesmanBindingNavigator).BeginInit();
		this.salesmanBindingNavigator.SuspendLayout();
		base.SuspendLayout();
		this.splitContainer.BorderStyle = System.Windows.Forms.BorderStyle.Fixed3D;
		resources.ApplyResources(this.splitContainer, "splitContainer");
		this.splitContainer.Name = "splitContainer";
		resources.ApplyResources(this.splitContainer.Panel1, "splitContainer.Panel1");
		this.splitContainer.Panel1.Controls.Add(this.salesmanDataGridView);
		this.splitContainer.Panel2.Controls.Add(this.rightfb_GroupBox);
		this.splitContainer.Panel2.Controls.Add(this.passwordLabel);
		this.splitContainer.Panel2.Controls.Add(this.passwordTextBox);
		this.splitContainer.Panel2.Controls.Add(this.priceChangeInfo_Label);
		this.splitContainer.Panel2.Controls.Add(this.codeLabel);
		this.splitContainer.Panel2.Controls.Add(this.rightfb_Label);
		this.splitContainer.Panel2.Controls.Add(this.discountHigh_Label);
		this.splitContainer.Panel2.Controls.Add(this.discountLow_Label);
		this.splitContainer.Panel2.Controls.Add(this.salesmanIDLabel);
		this.splitContainer.Panel2.Controls.Add(this.rightfbNumericUpDown);
		this.splitContainer.Panel2.Controls.Add(this.discounthighNumericUpDown);
		this.splitContainer.Panel2.Controls.Add(this.discountlowNumericUpDown);
		this.splitContainer.Panel2.Controls.Add(this.salesmanIDNumericUpDown);
		this.splitContainer.Panel2.Controls.Add(this.nameLabel);
		this.splitContainer.Panel2.Controls.Add(this.codeTextBox);
		this.splitContainer.Panel2.Controls.Add(this.nameTextBox);
		this.salesmanDataGridView.AllowUserToAddRows = false;
		this.salesmanDataGridView.AutoGenerateColumns = false;
		this.salesmanDataGridView.BackgroundColor = System.Drawing.SystemColors.Window;
		this.salesmanDataGridView.BorderStyle = System.Windows.Forms.BorderStyle.Fixed3D;
		this.salesmanDataGridView.Columns.AddRange(this.dataGridViewTextBoxColumn1, this.dataGridViewTextBoxColumn2, this.discountlowdataGridViewTextBoxColumn, this.discounthighdataGridViewTextBoxColumn, this.codedataGridViewTextBoxColumn);
		this.salesmanDataGridView.DataSource = this.salesmanBindingSource;
		resources.ApplyResources(this.salesmanDataGridView, "salesmanDataGridView");
		this.salesmanDataGridView.Name = "salesmanDataGridView";
		this.salesmanDataGridView.RowTemplate.Height = 23;
		this.salesmanDataGridView.SelectionMode = System.Windows.Forms.DataGridViewSelectionMode.FullRowSelect;
		this.salesmanDataGridView.DataError += new System.Windows.Forms.DataGridViewDataErrorEventHandler(salesmanDataGridView_DataError);
		this.salesmanDataGridView.KeyDown += new System.Windows.Forms.KeyEventHandler(salesmanDataGridView_KeyDown);
		this.dataGridViewTextBoxColumn1.DataPropertyName = "SalesmanID";
		resources.ApplyResources(this.dataGridViewTextBoxColumn1, "dataGridViewTextBoxColumn1");
		this.dataGridViewTextBoxColumn1.Name = "dataGridViewTextBoxColumn1";
		this.dataGridViewTextBoxColumn2.DataPropertyName = "Name";
		resources.ApplyResources(this.dataGridViewTextBoxColumn2, "dataGridViewTextBoxColumn2");
		this.dataGridViewTextBoxColumn2.Name = "dataGridViewTextBoxColumn2";
		this.discountlowdataGridViewTextBoxColumn.DataPropertyName = "Discount_Low";
		resources.ApplyResources(this.discountlowdataGridViewTextBoxColumn, "discountlowdataGridViewTextBoxColumn");
		this.discountlowdataGridViewTextBoxColumn.Name = "discountlowdataGridViewTextBoxColumn";
		this.discounthighdataGridViewTextBoxColumn.DataPropertyName = "Discount_High";
		resources.ApplyResources(this.discounthighdataGridViewTextBoxColumn, "discounthighdataGridViewTextBoxColumn");
		this.discounthighdataGridViewTextBoxColumn.Name = "discounthighdataGridViewTextBoxColumn";
		this.codedataGridViewTextBoxColumn.DataPropertyName = "Code";
		resources.ApplyResources(this.codedataGridViewTextBoxColumn, "codedataGridViewTextBoxColumn");
		this.codedataGridViewTextBoxColumn.Name = "codedataGridViewTextBoxColumn";
		this.salesmanBindingSource.DataMember = "Salesman";
		this.salesmanBindingSource.DataSource = this.eCSDataSet;
		this.salesmanBindingSource.BindingComplete += new System.Windows.Forms.BindingCompleteEventHandler(salesmanBindingSource_BindingComplete);
		this.eCSDataSet.DataSetName = "ECSDataSet";
		this.eCSDataSet.SchemaSerializationMode = System.Data.SchemaSerializationMode.IncludeSchema;
		this.rightfb_GroupBox.Controls.Add(this.IllegalReboot_CheckBox);
		this.rightfb_GroupBox.Controls.Add(this.BuyBack_CheckBox);
		this.rightfb_GroupBox.Controls.Add(this.FProgPrice_CheckBox);
		this.rightfb_GroupBox.Controls.Add(this.TSaleWT_CheckBox);
		this.rightfb_GroupBox.Controls.Add(this.TSaleCT_CheckBox);
		this.rightfb_GroupBox.Controls.Add(this.Preprint_CheckBox);
		this.rightfb_GroupBox.Controls.Add(this.Reprint_CheckBox);
		this.rightfb_GroupBox.Controls.Add(this.HangupRead_CheckBox);
		this.rightfb_GroupBox.Controls.Add(this.HangupWrite_CheckBox);
		this.rightfb_GroupBox.Controls.Add(this.Drawer_CheckBox);
		this.rightfb_GroupBox.Controls.Add(this.Amend_CheckBox);
		this.rightfb_GroupBox.Controls.Add(this.ItemQuit_CheckBox);
		resources.ApplyResources(this.rightfb_GroupBox, "rightfb_GroupBox");
		this.rightfb_GroupBox.Name = "rightfb_GroupBox";
		this.rightfb_GroupBox.TabStop = false;
		resources.ApplyResources(this.IllegalReboot_CheckBox, "IllegalReboot_CheckBox");
		this.IllegalReboot_CheckBox.Checked = true;
		this.IllegalReboot_CheckBox.CheckState = System.Windows.Forms.CheckState.Checked;
		this.IllegalReboot_CheckBox.Name = "IllegalReboot_CheckBox";
		this.IllegalReboot_CheckBox.UseVisualStyleBackColor = true;
		this.IllegalReboot_CheckBox.Click += new System.EventHandler(rightfbNumericUpDown_ValueChanged);
		resources.ApplyResources(this.BuyBack_CheckBox, "BuyBack_CheckBox");
		this.BuyBack_CheckBox.Checked = true;
		this.BuyBack_CheckBox.CheckState = System.Windows.Forms.CheckState.Checked;
		this.BuyBack_CheckBox.Name = "BuyBack_CheckBox";
		this.BuyBack_CheckBox.UseVisualStyleBackColor = true;
		this.BuyBack_CheckBox.Click += new System.EventHandler(rightfbNumericUpDown_ValueChanged);
		resources.ApplyResources(this.FProgPrice_CheckBox, "FProgPrice_CheckBox");
		this.FProgPrice_CheckBox.Checked = true;
		this.FProgPrice_CheckBox.CheckState = System.Windows.Forms.CheckState.Checked;
		this.FProgPrice_CheckBox.Name = "FProgPrice_CheckBox";
		this.FProgPrice_CheckBox.UseVisualStyleBackColor = true;
		this.FProgPrice_CheckBox.Click += new System.EventHandler(rightfbNumericUpDown_ValueChanged);
		resources.ApplyResources(this.TSaleWT_CheckBox, "TSaleWT_CheckBox");
		this.TSaleWT_CheckBox.Checked = true;
		this.TSaleWT_CheckBox.CheckState = System.Windows.Forms.CheckState.Checked;
		this.TSaleWT_CheckBox.Name = "TSaleWT_CheckBox";
		this.TSaleWT_CheckBox.UseVisualStyleBackColor = true;
		this.TSaleWT_CheckBox.Click += new System.EventHandler(rightfbNumericUpDown_ValueChanged);
		resources.ApplyResources(this.TSaleCT_CheckBox, "TSaleCT_CheckBox");
		this.TSaleCT_CheckBox.Checked = true;
		this.TSaleCT_CheckBox.CheckState = System.Windows.Forms.CheckState.Checked;
		this.TSaleCT_CheckBox.Name = "TSaleCT_CheckBox";
		this.TSaleCT_CheckBox.UseVisualStyleBackColor = true;
		this.TSaleCT_CheckBox.Click += new System.EventHandler(rightfbNumericUpDown_ValueChanged);
		resources.ApplyResources(this.Preprint_CheckBox, "Preprint_CheckBox");
		this.Preprint_CheckBox.Checked = true;
		this.Preprint_CheckBox.CheckState = System.Windows.Forms.CheckState.Checked;
		this.Preprint_CheckBox.Name = "Preprint_CheckBox";
		this.Preprint_CheckBox.UseVisualStyleBackColor = true;
		this.Preprint_CheckBox.Click += new System.EventHandler(rightfbNumericUpDown_ValueChanged);
		resources.ApplyResources(this.Reprint_CheckBox, "Reprint_CheckBox");
		this.Reprint_CheckBox.Checked = true;
		this.Reprint_CheckBox.CheckState = System.Windows.Forms.CheckState.Checked;
		this.Reprint_CheckBox.Name = "Reprint_CheckBox";
		this.Reprint_CheckBox.UseVisualStyleBackColor = true;
		this.Reprint_CheckBox.Click += new System.EventHandler(rightfbNumericUpDown_ValueChanged);
		resources.ApplyResources(this.HangupRead_CheckBox, "HangupRead_CheckBox");
		this.HangupRead_CheckBox.Checked = true;
		this.HangupRead_CheckBox.CheckState = System.Windows.Forms.CheckState.Checked;
		this.HangupRead_CheckBox.Name = "HangupRead_CheckBox";
		this.HangupRead_CheckBox.UseVisualStyleBackColor = true;
		this.HangupRead_CheckBox.Click += new System.EventHandler(rightfbNumericUpDown_ValueChanged);
		resources.ApplyResources(this.HangupWrite_CheckBox, "HangupWrite_CheckBox");
		this.HangupWrite_CheckBox.Checked = true;
		this.HangupWrite_CheckBox.CheckState = System.Windows.Forms.CheckState.Checked;
		this.HangupWrite_CheckBox.Name = "HangupWrite_CheckBox";
		this.HangupWrite_CheckBox.UseVisualStyleBackColor = true;
		this.HangupWrite_CheckBox.Click += new System.EventHandler(rightfbNumericUpDown_ValueChanged);
		resources.ApplyResources(this.Drawer_CheckBox, "Drawer_CheckBox");
		this.Drawer_CheckBox.Checked = true;
		this.Drawer_CheckBox.CheckState = System.Windows.Forms.CheckState.Checked;
		this.Drawer_CheckBox.Name = "Drawer_CheckBox";
		this.Drawer_CheckBox.UseVisualStyleBackColor = true;
		this.Drawer_CheckBox.Click += new System.EventHandler(rightfbNumericUpDown_ValueChanged);
		resources.ApplyResources(this.Amend_CheckBox, "Amend_CheckBox");
		this.Amend_CheckBox.Checked = true;
		this.Amend_CheckBox.CheckState = System.Windows.Forms.CheckState.Checked;
		this.Amend_CheckBox.Name = "Amend_CheckBox";
		this.Amend_CheckBox.UseVisualStyleBackColor = true;
		this.Amend_CheckBox.Click += new System.EventHandler(rightfbNumericUpDown_ValueChanged);
		resources.ApplyResources(this.ItemQuit_CheckBox, "ItemQuit_CheckBox");
		this.ItemQuit_CheckBox.Checked = true;
		this.ItemQuit_CheckBox.CheckState = System.Windows.Forms.CheckState.Checked;
		this.ItemQuit_CheckBox.Name = "ItemQuit_CheckBox";
		this.ItemQuit_CheckBox.UseVisualStyleBackColor = true;
		this.ItemQuit_CheckBox.Click += new System.EventHandler(rightfbNumericUpDown_ValueChanged);
		resources.ApplyResources(this.passwordLabel, "passwordLabel");
		this.passwordLabel.Name = "passwordLabel";
		this.passwordTextBox.DataBindings.Add(new System.Windows.Forms.Binding("Text", this.salesmanBindingSource, "Password", true));
		resources.ApplyResources(this.passwordTextBox, "passwordTextBox");
		this.passwordTextBox.Name = "passwordTextBox";
		resources.ApplyResources(this.priceChangeInfo_Label, "priceChangeInfo_Label");
		this.priceChangeInfo_Label.ForeColor = System.Drawing.Color.Red;
		this.priceChangeInfo_Label.Name = "priceChangeInfo_Label";
		resources.ApplyResources(this.codeLabel, "codeLabel");
		this.codeLabel.Name = "codeLabel";
		resources.ApplyResources(this.rightfb_Label, "rightfb_Label");
		this.rightfb_Label.Name = "rightfb_Label";
		resources.ApplyResources(this.discountHigh_Label, "discountHigh_Label");
		this.discountHigh_Label.Name = "discountHigh_Label";
		resources.ApplyResources(this.discountLow_Label, "discountLow_Label");
		this.discountLow_Label.Name = "discountLow_Label";
		resources.ApplyResources(this.salesmanIDLabel, "salesmanIDLabel");
		this.salesmanIDLabel.Name = "salesmanIDLabel";
		this.rightfbNumericUpDown.DataBindings.Add(new System.Windows.Forms.Binding("Value", this.salesmanBindingSource, "RightFB", true));
		resources.ApplyResources(this.rightfbNumericUpDown, "rightfbNumericUpDown");
		this.rightfbNumericUpDown.Maximum = new decimal(new int[4] { 65535, 0, 0, 0 });
		this.rightfbNumericUpDown.Name = "rightfbNumericUpDown";
		this.rightfbNumericUpDown.ValueChanged += new System.EventHandler(rightfbNumericUpDown_ValueChanged);
		this.discounthighNumericUpDown.DataBindings.Add(new System.Windows.Forms.Binding("Value", this.salesmanBindingSource, "Discount_High", true));
		resources.ApplyResources(this.discounthighNumericUpDown, "discounthighNumericUpDown");
		this.discounthighNumericUpDown.Maximum = new decimal(new int[4] { 255, 0, 0, 0 });
		this.discounthighNumericUpDown.Name = "discounthighNumericUpDown";
		this.discountlowNumericUpDown.DataBindings.Add(new System.Windows.Forms.Binding("Value", this.salesmanBindingSource, "Discount_Low", true));
		resources.ApplyResources(this.discountlowNumericUpDown, "discountlowNumericUpDown");
		this.discountlowNumericUpDown.Maximum = new decimal(new int[4] { 255, 0, 0, 0 });
		this.discountlowNumericUpDown.Name = "discountlowNumericUpDown";
		this.salesmanIDNumericUpDown.DataBindings.Add(new System.Windows.Forms.Binding("Value", this.salesmanBindingSource, "SalesmanID", true, System.Windows.Forms.DataSourceUpdateMode.OnPropertyChanged));
		resources.ApplyResources(this.salesmanIDNumericUpDown, "salesmanIDNumericUpDown");
		this.salesmanIDNumericUpDown.Maximum = ECS.Properties.Settings.Default.maxSalesmanID;
		this.salesmanIDNumericUpDown.Name = "salesmanIDNumericUpDown";
		resources.ApplyResources(this.nameLabel, "nameLabel");
		this.nameLabel.Name = "nameLabel";
		this.codeTextBox.DataBindings.Add(new System.Windows.Forms.Binding("Text", this.salesmanBindingSource, "Code", true));
		resources.ApplyResources(this.codeTextBox, "codeTextBox");
		this.codeTextBox.Name = "codeTextBox";
		this.nameTextBox.DataBindings.Add(new System.Windows.Forms.Binding("Text", this.salesmanBindingSource, "Name", true, System.Windows.Forms.DataSourceUpdateMode.OnPropertyChanged));
		resources.ApplyResources(this.nameTextBox, "nameTextBox");
		this.nameTextBox.Name = "nameTextBox";
		this.salesmanBindingNavigator.AddNewItem = this.bindingNavigatorAddNewItem;
		this.salesmanBindingNavigator.BindingSource = this.salesmanBindingSource;
		this.salesmanBindingNavigator.CountItem = this.bindingNavigatorCountItem;
		this.salesmanBindingNavigator.DeleteItem = null;
		this.salesmanBindingNavigator.Items.AddRange(new System.Windows.Forms.ToolStripItem[17]
		{
			this.bindingNavigatorMoveFirstItem, this.bindingNavigatorMovePreviousItem, this.bindingNavigatorSeparator, this.bindingNavigatorPositionItem, this.bindingNavigatorCountItem, this.bindingNavigatorSeparator1, this.bindingNavigatorMoveNextItem, this.bindingNavigatorMoveLastItem, this.bindingNavigatorSeparator2, this.bindingNavigatorAddNewItem,
			this.bindingNavigatorDeleteItem, this.toolStripSeparator1, this.bindingNavigatorID, this.bindingNavigatorGoto, this.bindingNavigatorFilter, this.P0_TMSFile_toolStripButton, this.P0_Ethernet_toolStripButton
		});
		resources.ApplyResources(this.salesmanBindingNavigator, "salesmanBindingNavigator");
		this.salesmanBindingNavigator.MoveFirstItem = this.bindingNavigatorMoveFirstItem;
		this.salesmanBindingNavigator.MoveLastItem = this.bindingNavigatorMoveLastItem;
		this.salesmanBindingNavigator.MoveNextItem = this.bindingNavigatorMoveNextItem;
		this.salesmanBindingNavigator.MovePreviousItem = this.bindingNavigatorMovePreviousItem;
		this.salesmanBindingNavigator.Name = "salesmanBindingNavigator";
		this.salesmanBindingNavigator.PositionItem = this.bindingNavigatorPositionItem;
		this.bindingNavigatorAddNewItem.DisplayStyle = System.Windows.Forms.ToolStripItemDisplayStyle.Image;
		this.bindingNavigatorAddNewItem.Image = ECS.Properties.Resources.bindingNavigatorAddNewItem;
		this.bindingNavigatorAddNewItem.Name = "bindingNavigatorAddNewItem";
		resources.ApplyResources(this.bindingNavigatorAddNewItem, "bindingNavigatorAddNewItem");
		this.bindingNavigatorCountItem.Name = "bindingNavigatorCountItem";
		resources.ApplyResources(this.bindingNavigatorCountItem, "bindingNavigatorCountItem");
		this.bindingNavigatorMoveFirstItem.DisplayStyle = System.Windows.Forms.ToolStripItemDisplayStyle.Image;
		this.bindingNavigatorMoveFirstItem.Image = ECS.Properties.Resources.bindingNavigatorMoveFirstItem;
		this.bindingNavigatorMoveFirstItem.Name = "bindingNavigatorMoveFirstItem";
		resources.ApplyResources(this.bindingNavigatorMoveFirstItem, "bindingNavigatorMoveFirstItem");
		this.bindingNavigatorMovePreviousItem.DisplayStyle = System.Windows.Forms.ToolStripItemDisplayStyle.Image;
		this.bindingNavigatorMovePreviousItem.Image = ECS.Properties.Resources.bindingNavigatorMovePreviousItem;
		this.bindingNavigatorMovePreviousItem.Name = "bindingNavigatorMovePreviousItem";
		resources.ApplyResources(this.bindingNavigatorMovePreviousItem, "bindingNavigatorMovePreviousItem");
		this.bindingNavigatorSeparator.Name = "bindingNavigatorSeparator";
		resources.ApplyResources(this.bindingNavigatorSeparator, "bindingNavigatorSeparator");
		resources.ApplyResources(this.bindingNavigatorPositionItem, "bindingNavigatorPositionItem");
		this.bindingNavigatorPositionItem.Name = "bindingNavigatorPositionItem";
		this.bindingNavigatorSeparator1.Name = "bindingNavigatorSeparator1";
		resources.ApplyResources(this.bindingNavigatorSeparator1, "bindingNavigatorSeparator1");
		this.bindingNavigatorMoveNextItem.DisplayStyle = System.Windows.Forms.ToolStripItemDisplayStyle.Image;
		this.bindingNavigatorMoveNextItem.Image = ECS.Properties.Resources.bindingNavigatorMoveNextItem;
		this.bindingNavigatorMoveNextItem.Name = "bindingNavigatorMoveNextItem";
		resources.ApplyResources(this.bindingNavigatorMoveNextItem, "bindingNavigatorMoveNextItem");
		this.bindingNavigatorMoveLastItem.DisplayStyle = System.Windows.Forms.ToolStripItemDisplayStyle.Image;
		this.bindingNavigatorMoveLastItem.Image = ECS.Properties.Resources.bindingNavigatorMoveLastItem;
		this.bindingNavigatorMoveLastItem.Name = "bindingNavigatorMoveLastItem";
		resources.ApplyResources(this.bindingNavigatorMoveLastItem, "bindingNavigatorMoveLastItem");
		this.bindingNavigatorSeparator2.Name = "bindingNavigatorSeparator2";
		resources.ApplyResources(this.bindingNavigatorSeparator2, "bindingNavigatorSeparator2");
		this.bindingNavigatorDeleteItem.DisplayStyle = System.Windows.Forms.ToolStripItemDisplayStyle.Image;
		this.bindingNavigatorDeleteItem.Image = ECS.Properties.Resources.bindingNavigatorDeleteItem;
		this.bindingNavigatorDeleteItem.Name = "bindingNavigatorDeleteItem";
		resources.ApplyResources(this.bindingNavigatorDeleteItem, "bindingNavigatorDeleteItem");
		this.bindingNavigatorDeleteItem.Click += new System.EventHandler(bindingNavigatorDeleteItem_Click);
		this.toolStripSeparator1.Name = "toolStripSeparator1";
		resources.ApplyResources(this.toolStripSeparator1, "toolStripSeparator1");
		this.bindingNavigatorID.Name = "bindingNavigatorID";
		resources.ApplyResources(this.bindingNavigatorID, "bindingNavigatorID");
		this.bindingNavigatorGoto.DisplayStyle = System.Windows.Forms.ToolStripItemDisplayStyle.Image;
		this.bindingNavigatorGoto.Image = ECS.Properties.Resources.bindingNavigatorGoto;
		resources.ApplyResources(this.bindingNavigatorGoto, "bindingNavigatorGoto");
		this.bindingNavigatorGoto.Name = "bindingNavigatorGoto";
		this.bindingNavigatorGoto.Click += new System.EventHandler(bindingNavigatorGoto_Click);
		this.bindingNavigatorFilter.CheckOnClick = true;
		this.bindingNavigatorFilter.DisplayStyle = System.Windows.Forms.ToolStripItemDisplayStyle.Image;
		this.bindingNavigatorFilter.Image = ECS.Properties.Resources.bindingNavigatorFilter;
		resources.ApplyResources(this.bindingNavigatorFilter, "bindingNavigatorFilter");
		this.bindingNavigatorFilter.Name = "bindingNavigatorFilter";
		this.bindingNavigatorFilter.CheckedChanged += new System.EventHandler(bindingNavigatorFilter_CheckedChanged);
		resources.ApplyResources(this.P0_TMSFile_toolStripButton, "P0_TMSFile_toolStripButton");
		this.P0_TMSFile_toolStripButton.Name = "P0_TMSFile_toolStripButton";
		this.P0_TMSFile_toolStripButton.Click += new System.EventHandler(P0_TMSFile_toolStripButton_Click);
		resources.ApplyResources(this.P0_Ethernet_toolStripButton, "P0_Ethernet_toolStripButton");
		this.P0_Ethernet_toolStripButton.Name = "P0_Ethernet_toolStripButton";
		this.P0_Ethernet_toolStripButton.Click += new System.EventHandler(P0_Ethernet_toolStripButton_Click);
		this.salesmanTableAdapter.ClearBeforeFill = true;
		resources.ApplyResources(this, "$this");
		base.AutoScaleMode = System.Windows.Forms.AutoScaleMode.Font;
		base.Controls.Add(this.splitContainer);
		base.Controls.Add(this.salesmanBindingNavigator);
		base.Name = "SalesmanForm";
		base.FormClosing += new System.Windows.Forms.FormClosingEventHandler(SalesmanForm_FormClosing);
		base.Load += new System.EventHandler(SalesmanForm_Load);
		base.Leave += new System.EventHandler(SalesmanForm_Leave);
		this.splitContainer.Panel1.ResumeLayout(false);
		this.splitContainer.Panel2.ResumeLayout(false);
		this.splitContainer.Panel2.PerformLayout();
		this.splitContainer.ResumeLayout(false);
		((System.ComponentModel.ISupportInitialize)this.salesmanDataGridView).EndInit();
		((System.ComponentModel.ISupportInitialize)this.salesmanBindingSource).EndInit();
		((System.ComponentModel.ISupportInitialize)this.eCSDataSet).EndInit();
		this.rightfb_GroupBox.ResumeLayout(false);
		this.rightfb_GroupBox.PerformLayout();
		((System.ComponentModel.ISupportInitialize)this.rightfbNumericUpDown).EndInit();
		((System.ComponentModel.ISupportInitialize)this.discounthighNumericUpDown).EndInit();
		((System.ComponentModel.ISupportInitialize)this.discountlowNumericUpDown).EndInit();
		((System.ComponentModel.ISupportInitialize)this.salesmanIDNumericUpDown).EndInit();
		((System.ComponentModel.ISupportInitialize)this.salesmanBindingNavigator).EndInit();
		this.salesmanBindingNavigator.ResumeLayout(false);
		this.salesmanBindingNavigator.PerformLayout();
		base.ResumeLayout(false);
		base.PerformLayout();
	}

	public SalesmanForm()
	{
		InitializeComponent();
	}

	public void DataSet_Refresh(string Type)
	{
		if (base.InvokeRequired)
		{
			Invoke(new DataSet_RefreshCallback(DataSet_Refresh), Type);
		}
		else if (Type == "Salesman")
		{
			NoCTRowChanged = true;
			eCSDataSet.Salesman.Clear();
			salesmanTableAdapter.Fill(eCSDataSet.Salesman);
			salesmanBindingSource.ResetBindings(metadataChanged: false);
			NoCTRowChanged = false;
		}
	}

	private void DataSet_Update(string Type)
	{
		Program.mf.DataSet_Update(Type, "SalesmanForm");
	}

	private void LangSocket_Ramuza()
	{
		Label label = discountLow_Label;
		Label label2 = discountHigh_Label;
		NumericUpDown numericUpDown = discountlowNumericUpDown;
		bool flag = (discounthighNumericUpDown.Visible = false);
		bool flag3 = (numericUpDown.Visible = flag);
		bool visible = (label2.Visible = flag3);
		label.Visible = visible;
		DataGridViewTextBoxColumn dataGridViewTextBoxColumn = discountlowdataGridViewTextBoxColumn;
		bool visible2 = (discounthighdataGridViewTextBoxColumn.Visible = false);
		dataGridViewTextBoxColumn.Visible = visible2;
		priceChangeInfo_Label.Visible = false;
		CheckBox preprint_CheckBox = Preprint_CheckBox;
		CheckBox fProgPrice_CheckBox = FProgPrice_CheckBox;
		CheckBox drawer_CheckBox = Drawer_CheckBox;
		CheckBox hangupWrite_CheckBox = HangupWrite_CheckBox;
		CheckBox hangupRead_CheckBox = HangupRead_CheckBox;
		CheckBox buyBack_CheckBox = BuyBack_CheckBox;
		bool flag7 = (IllegalReboot_CheckBox.Visible = false);
		bool flag9 = (buyBack_CheckBox.Visible = flag7);
		bool flag11 = (hangupRead_CheckBox.Visible = flag9);
		bool flag13 = (hangupWrite_CheckBox.Visible = flag11);
		bool flag15 = (drawer_CheckBox.Visible = flag13);
		bool visible3 = (fProgPrice_CheckBox.Visible = flag15);
		preprint_CheckBox.Visible = visible3;
	}

	private void SalesmanForm_Load(object sender, EventArgs e)
	{
		Text = Program.GetLang("pw_Salesman");
		Amend_CheckBox.Text = Program.GetLang("pw_Amend");
		bindingNavigatorAddNewItem.Text = Program.GetLang("pw_AddNew");
		bindingNavigatorDeleteItem.Text = Program.GetLang("pw_Delete");
		bindingNavigatorFilter.Text = Program.GetLang("pw_Filter");
		bindingNavigatorGoto.Text = Program.GetLang("pw_Switchto");
		bindingNavigatorMoveFirstItem.Text = Program.GetLang("pw_FirstRecord");
		bindingNavigatorMoveLastItem.Text = Program.GetLang("pw_LastRecord");
		bindingNavigatorMoveNextItem.Text = Program.GetLang("pw_NextRecord");
		bindingNavigatorMovePreviousItem.Text = Program.GetLang("pw_PreviousRecord");
		BuyBack_CheckBox.Text = Program.GetLang("pw_BuyBack_OT");
		codedataGridViewTextBoxColumn.HeaderText = Program.GetLang("pw_Code");
		codeLabel.Text = Program.GetLang("pw_Code") + ":";
		dataGridViewTextBoxColumn1.HeaderText = Program.GetLang("pw_Number");
		dataGridViewTextBoxColumn2.HeaderText = Program.GetLang("pw_Name");
		discountHigh_Label.Text = Program.GetLang("pw_PriceChangeHigh_pct_") + ":";
		discounthighdataGridViewTextBoxColumn.HeaderText = Program.GetLang("pw_PriceChangeHigh_pct_");
		discountLow_Label.Text = Program.GetLang("pw_PriceChangeLow_pct_") + ":";
		discountlowdataGridViewTextBoxColumn.HeaderText = Program.GetLang("pw_PriceChangeLow_pct_");
		IllegalReboot_CheckBox.Text = Program.GetLang("pw_IllegalReboot");
		Drawer_CheckBox.Text = Program.GetLang("pw_Drawer");
		FProgPrice_CheckBox.Text = Program.GetLang("pw_FProgofPrice");
		HangupRead_CheckBox.Text = Program.GetLang("pw_LoadbackBill");
		HangupWrite_CheckBox.Text = Program.GetLang("pw_HangupBill");
		ItemQuit_CheckBox.Text = Program.GetLang("pw_PLUQuit");
		nameLabel.Text = Program.GetLang("pw_Name") + ":";
		P0_Ethernet_toolStripButton.Text = Program.GetLang("pw_Ethernet");
		P0_TMSFile_toolStripButton.Text = Program.GetLang("pw_TMSFile");
		passwordLabel.Text = Program.GetLang("pw_Password") + ":";
		Preprint_CheckBox.Text = Program.GetLang("pw_Pre-print");
		priceChangeInfo_Label.Text = Program.GetLang("pw_UppertwoarelowerprioritythenSpec110_112");
		Reprint_CheckBox.Text = Program.GetLang("pw_Re-print");
		rightfb_GroupBox.Text = Program.GetLang("pw_RightTable");
		rightfb_Label.Text = Program.GetLang("pw_RightFB_sl_");
		salesmanIDLabel.Text = Program.GetLang("pw_Number") + ":";
		TSaleCT_CheckBox.Text = Program.GetLang("pw_TSale_CT");
		TSaleWT_CheckBox.Text = Program.GetLang("pw_TSale_WT");
		Font = Settings.Default.CustomFont;
		if (Program.right == Program.Right.User)
		{
			salesmanBindingSource.Filter = "SalesmanID >= " + Settings.Default.minUserSalesmanID;
		}
		Program.LabelRight_SetXLocaltion(new Label[7] { salesmanIDLabel, nameLabel, passwordLabel, discountLow_Label, discountHigh_Label, codeLabel, rightfb_Label }, new Control[7] { salesmanIDNumericUpDown, nameTextBox, passwordTextBox, discountlowNumericUpDown, discounthighNumericUpDown, codeTextBox, rightfbNumericUpDown });
		Program.LabelRight_SetXLocaltion(new Control[6] { Reprint_CheckBox, TSaleWT_CheckBox, ItemQuit_CheckBox, HangupWrite_CheckBox, FProgPrice_CheckBox, Drawer_CheckBox }, new Control[6] { Preprint_CheckBox, TSaleCT_CheckBox, Amend_CheckBox, HangupRead_CheckBox, BuyBack_CheckBox, IllegalReboot_CheckBox });
		rightfb_GroupBox.Size = new Size(Program.LabelRight_CalXLocaltion(new Control[6] { Preprint_CheckBox, TSaleCT_CheckBox, Amend_CheckBox, HangupRead_CheckBox, BuyBack_CheckBox, IllegalReboot_CheckBox }) + 20 - rightfb_GroupBox.Location.X, rightfb_GroupBox.Size.Height);
		salesmanTableAdapter.Fill(eCSDataSet.Salesman);
		eCSDataSet.Salesman.SalesmanRowChanged += Salesman_SalesmanRowChanged;
		if (Program.LangSocket.Contains("Ramuza"))
		{
			LangSocket_Ramuza();
		}
	}

	private void Salesman_SalesmanRowChanged(object sender, ECSDataSet.SalesmanRowChangeEvent e)
	{
		if (NoCTRowChanged || e.Action == DataRowAction.Rollback || e.Action == DataRowAction.Commit)
		{
			return;
		}
		if (e.Row.SalesmanID > Settings.Default.maxSalesmanID)
		{
			e.Row.RejectChanges();
			return;
		}
		if (e.Row.SalesmanID < Settings.Default.minUserSalesmanID && Program.right == Program.Right.User)
		{
			e.Row.RejectChanges();
			return;
		}
		try
		{
			salesmanTableAdapter.Update(eCSDataSet.Salesman);
			DataSet_Changed = true;
		}
		catch (Exception ex)
		{
			MessageBox.Show(this, Program.GetLang("pw_Error_OperationFailed") + Environment.NewLine + Environment.NewLine + ex.Message, Program.GetLang("pw_TM_xAManagementProgram") + Resources.Version, MessageBoxButtons.OK, MessageBoxIcon.Hand);
		}
	}

	public void SaveData()
	{
		Validate();
		try
		{
			salesmanBindingSource.EndEdit();
		}
		catch (Exception ex)
		{
			MessageBox.Show(this, Program.GetLang("pw_Error_OperationFailed") + Environment.NewLine + Environment.NewLine + ex.Message, Program.GetLang("pw_TM_xAManagementProgram") + Resources.Version, MessageBoxButtons.OK, MessageBoxIcon.Hand);
			salesmanBindingSource.CancelEdit();
		}
		if (eCSDataSet.HasChanges())
		{
			try
			{
				salesmanTableAdapter.Update(eCSDataSet.Salesman);
				DataSet_Changed = true;
			}
			catch (Exception ex2)
			{
				MessageBox.Show(this, Program.GetLang("pw_Error_OperationFailed") + Environment.NewLine + Environment.NewLine + ex2.Message, Program.GetLang("pw_TM_xAManagementProgram") + Resources.Version, MessageBoxButtons.OK, MessageBoxIcon.Hand);
			}
		}
	}

	private void SalesmanForm_FormClosing(object sender, FormClosingEventArgs e)
	{
		eCSDataSet.Salesman.SalesmanRowChanged -= Salesman_SalesmanRowChanged;
		Select(directed: true, forward: true);
		SaveData();
	}

	private void bindingNavigatorGoto_Click(object sender, EventArgs e)
	{
		if (bindingNavigatorID.Text.Length != 0)
		{
			int num = salesmanBindingSource.Find("SalesmanID", bindingNavigatorID.Text);
			if (num != -1)
			{
				salesmanBindingSource.Position = num;
			}
		}
	}

	private void bindingNavigatorFilter_CheckedChanged(object sender, EventArgs e)
	{
		if (bindingNavigatorFilter.Checked)
		{
			using (FilterForm filterForm = new FilterForm(salesmanDataGridView))
			{
				if (filterForm.ShowDialog(this) == DialogResult.OK)
				{
					salesmanBindingSource.Filter = filterForm.FilterString;
					if (Program.right == Program.Right.User)
					{
						BindingSource bindingSource = salesmanBindingSource;
						bindingSource.Filter = bindingSource.Filter + " AND SalesmanID >= " + Settings.Default.minUserSalesmanID;
					}
				}
				else
				{
					bindingNavigatorFilter.Checked = false;
				}
				return;
			}
		}
		if (Program.right == Program.Right.User)
		{
			salesmanBindingSource.Filter = "SalesmanID >= " + Settings.Default.minUserSalesmanID;
		}
		else
		{
			salesmanBindingSource.RemoveFilter();
		}
	}

	private void salesmanDataGridView_DataError(object sender, DataGridViewDataErrorEventArgs e)
	{
		e.Cancel = true;
	}

	private void salesmanBindingSource_BindingComplete(object sender, BindingCompleteEventArgs e)
	{
		if (e.BindingCompleteContext == BindingCompleteContext.DataSourceUpdate)
		{
			BindingSource bindingSource = sender as BindingSource;
			try
			{
				bindingSource.EndEdit();
			}
			catch (Exception ex)
			{
				MessageBox.Show(this, Program.GetLang("pw_Error_OperationFailed") + Environment.NewLine + Environment.NewLine + ex.Message, Program.GetLang("pw_TM_xAManagementProgram") + Resources.Version, MessageBoxButtons.OK, MessageBoxIcon.Hand);
				bindingSource.CancelEdit();
			}
		}
	}

	private void P0_TMSFile_toolStripButton_Click(object sender, EventArgs e)
	{
		Program.mf.ShowDialog_TMSfile_Hold(Wizard: false, Spec: false, String: false, Barcode: false, Label: false, PLU: false, Face: false, Dept: false, Class: false, Unit: false, Salesman: true, SP1: false, SP2: false, SP3: false, SP4: false);
	}

	private void P0_Ethernet_toolStripButton_Click(object sender, EventArgs e)
	{
		Program.mf.PopMdiChild_Ethernet_Hold(Wizard: false, Spec: false, String: false, Barcode: false, Label: false, PLU: false, Face: false, Dept: false, Class: false, Unit: false, Salesman: true, SP1: false, SP2: false, SP3: false, SP4: false);
		if (Program.mf.m_netForm.mf_Docked)
		{
			base.WindowState = FormWindowState.Normal;
			Close();
		}
	}

	private void rightfbNumericUpDown_ValueChanged(object sender, EventArgs e)
	{
		if (sender == rightfbNumericUpDown)
		{
			Reprint_CheckBox.Checked = ((uint)rightfbNumericUpDown.Value & 1) == 0;
			Preprint_CheckBox.Checked = ((uint)rightfbNumericUpDown.Value & 2) == 0;
			TSaleWT_CheckBox.Checked = ((uint)rightfbNumericUpDown.Value & 4) == 0;
			TSaleCT_CheckBox.Checked = ((uint)rightfbNumericUpDown.Value & 8) == 0;
			ItemQuit_CheckBox.Checked = ((uint)rightfbNumericUpDown.Value & 0x10) == 0;
			Amend_CheckBox.Checked = ((uint)rightfbNumericUpDown.Value & 0x20) == 0;
			HangupWrite_CheckBox.Checked = ((uint)rightfbNumericUpDown.Value & 0x40) == 0;
			HangupRead_CheckBox.Checked = ((uint)rightfbNumericUpDown.Value & 0x80) == 0;
			FProgPrice_CheckBox.Checked = ((uint)rightfbNumericUpDown.Value & 0x100) == 0;
			BuyBack_CheckBox.Checked = ((uint)rightfbNumericUpDown.Value & 0x200) == 0;
			Drawer_CheckBox.Checked = ((uint)rightfbNumericUpDown.Value & 0x400) == 0;
			IllegalReboot_CheckBox.Checked = ((uint)rightfbNumericUpDown.Value & 0x800) == 0;
		}
		else
		{
			rightfbNumericUpDown.Value = (int)(((!Reprint_CheckBox.Checked) ? 1u : 0u) | (uint)((!Preprint_CheckBox.Checked) ? 2 : 0) | (uint)((!TSaleWT_CheckBox.Checked) ? 4 : 0) | (uint)((!TSaleCT_CheckBox.Checked) ? 8 : 0) | (uint)((!ItemQuit_CheckBox.Checked) ? 16 : 0) | (uint)((!Amend_CheckBox.Checked) ? 32 : 0) | (uint)((!HangupWrite_CheckBox.Checked) ? 64 : 0) | (uint)((!HangupRead_CheckBox.Checked) ? 128 : 0) | (uint)((!FProgPrice_CheckBox.Checked) ? 256 : 0) | (uint)((!BuyBack_CheckBox.Checked) ? 512 : 0) | (uint)((!Drawer_CheckBox.Checked) ? 1024 : 0)) | ((!IllegalReboot_CheckBox.Checked) ? 2048 : 0);
		}
	}

	private void SalesmanForm_Leave(object sender, EventArgs e)
	{
		salesmanDataGridView.EndEdit();
		salesmanBindingSource.EndEdit();
		if (DataSet_Changed)
		{
			DataSet_Update("Salesman");
			DataSet_Changed = false;
		}
	}

	private void DeleteSelect()
	{
		foreach (DataGridViewRow selectedRow in salesmanDataGridView.SelectedRows)
		{
			if (selectedRow.DataBoundItem is DataRowView dataRowView)
			{
				dataRowView.Row.Delete();
			}
		}
		try
		{
			salesmanTableAdapter.Update(eCSDataSet.Salesman);
			DataSet_Changed = true;
		}
		catch (Exception ex)
		{
			MessageBox.Show(this, Program.GetLang("pw_Error_OperationFailed") + Environment.NewLine + Environment.NewLine + ex.Message, Program.GetLang("pw_TM_xAManagementProgram") + Resources.Version, MessageBoxButtons.OK, MessageBoxIcon.Hand);
		}
	}

	private void bindingNavigatorDeleteItem_Click(object sender, EventArgs e)
	{
		DeleteSelect();
	}

	private void salesmanDataGridView_KeyDown(object sender, KeyEventArgs e)
	{
		if (e.KeyCode == Keys.Delete)
		{
			e.Handled = true;
			DeleteSelect();
		}
	}
}
