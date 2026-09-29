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

namespace ECS;

public class ExcelForm : Form
{
	private IContainer components;

	private UIDataSet uiDataSet;

	private BindingSource pLU_ColBindingSource;

	private ECSDataSet ecsDataSet;

	private PLUTableAdapter pLUTableAdapter;

	private RadioButton saveButton;

	private RadioButton openButton;

	private Button exeButton;

	private BindingSource excelBindingSource;

	private ExcelTableAdapter excelTableAdapter;

	private DataGridView excelDataGridView;

	private BindingNavigator bindingNavigator;

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

	private DataGridViewTextBoxColumn idColumn;

	private DataGridViewComboBoxColumn fieldColumn;

	private ToolStripButton clearToolStripButton;

	private SplitContainer splitContainer1;

	private BindingSource excelDefaultBindingSource;

	private ExcelDefaultTableAdapter excelDefaultTableAdapter;

	private DataGridView excelDefaultDataGridView;

	private BindingNavigator bindingNavigator1;

	private ToolStripButton toolStripButton1;

	private ToolStripLabel toolStripLabel1;

	private ToolStripButton toolStripButton2;

	private ToolStripButton toolStripButton3;

	private ToolStripButton toolStripButton4;

	private ToolStripSeparator toolStripSeparator1;

	private ToolStripTextBox toolStripTextBox1;

	private ToolStripSeparator toolStripSeparator2;

	private ToolStripButton toolStripButton5;

	private ToolStripButton toolStripButton6;

	private ToolStripSeparator toolStripSeparator3;

	private ToolStripButton toolStripButton7;

	private BindingSource plu_ColbindingSource1;

	private DataGridViewTextBoxColumn dataGridViewTextBoxColumn1;

	private DataGridViewComboBoxColumn dataGridViewTextBoxColumn2;

	private DataGridViewTextBoxColumn dataGridViewTextBoxColumn3;

	private string[] UnitTable;

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
		System.ComponentModel.ComponentResourceManager resources = new System.ComponentModel.ComponentResourceManager(typeof(ECS.ExcelForm));
		this.splitContainer = new System.Windows.Forms.SplitContainer();
		this.splitContainer1 = new System.Windows.Forms.SplitContainer();
		this.excelDataGridView = new System.Windows.Forms.DataGridView();
		this.idColumn = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.fieldColumn = new System.Windows.Forms.DataGridViewComboBoxColumn();
		this.pLU_ColBindingSource = new System.Windows.Forms.BindingSource(this.components);
		this.uiDataSet = new ECS.UIDataSet();
		this.excelBindingSource = new System.Windows.Forms.BindingSource(this.components);
		this.ecsDataSet = new ECS.ECSDataSet();
		this.bindingNavigator = new System.Windows.Forms.BindingNavigator(this.components);
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
		this.clearToolStripButton = new System.Windows.Forms.ToolStripButton();
		this.excelDefaultDataGridView = new System.Windows.Forms.DataGridView();
		this.dataGridViewTextBoxColumn1 = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.dataGridViewTextBoxColumn2 = new System.Windows.Forms.DataGridViewComboBoxColumn();
		this.plu_ColbindingSource1 = new System.Windows.Forms.BindingSource(this.components);
		this.dataGridViewTextBoxColumn3 = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.excelDefaultBindingSource = new System.Windows.Forms.BindingSource(this.components);
		this.bindingNavigator1 = new System.Windows.Forms.BindingNavigator(this.components);
		this.toolStripButton1 = new System.Windows.Forms.ToolStripButton();
		this.toolStripLabel1 = new System.Windows.Forms.ToolStripLabel();
		this.toolStripButton2 = new System.Windows.Forms.ToolStripButton();
		this.toolStripButton3 = new System.Windows.Forms.ToolStripButton();
		this.toolStripButton4 = new System.Windows.Forms.ToolStripButton();
		this.toolStripSeparator1 = new System.Windows.Forms.ToolStripSeparator();
		this.toolStripTextBox1 = new System.Windows.Forms.ToolStripTextBox();
		this.toolStripSeparator2 = new System.Windows.Forms.ToolStripSeparator();
		this.toolStripButton5 = new System.Windows.Forms.ToolStripButton();
		this.toolStripButton6 = new System.Windows.Forms.ToolStripButton();
		this.toolStripSeparator3 = new System.Windows.Forms.ToolStripSeparator();
		this.toolStripButton7 = new System.Windows.Forms.ToolStripButton();
		this.saveButton = new System.Windows.Forms.RadioButton();
		this.exeButton = new System.Windows.Forms.Button();
		this.openButton = new System.Windows.Forms.RadioButton();
		this.pLUTableAdapter = new ECS.ECSDataSetTableAdapters.PLUTableAdapter();
		this.excelTableAdapter = new ECS.ECSDataSetTableAdapters.ExcelTableAdapter();
		this.excelDefaultTableAdapter = new ECS.ECSDataSetTableAdapters.ExcelDefaultTableAdapter();
		this.splitContainer.Panel1.SuspendLayout();
		this.splitContainer.Panel2.SuspendLayout();
		this.splitContainer.SuspendLayout();
		this.splitContainer1.Panel1.SuspendLayout();
		this.splitContainer1.Panel2.SuspendLayout();
		this.splitContainer1.SuspendLayout();
		((System.ComponentModel.ISupportInitialize)this.excelDataGridView).BeginInit();
		((System.ComponentModel.ISupportInitialize)this.pLU_ColBindingSource).BeginInit();
		((System.ComponentModel.ISupportInitialize)this.uiDataSet).BeginInit();
		((System.ComponentModel.ISupportInitialize)this.excelBindingSource).BeginInit();
		((System.ComponentModel.ISupportInitialize)this.ecsDataSet).BeginInit();
		((System.ComponentModel.ISupportInitialize)this.bindingNavigator).BeginInit();
		this.bindingNavigator.SuspendLayout();
		((System.ComponentModel.ISupportInitialize)this.excelDefaultDataGridView).BeginInit();
		((System.ComponentModel.ISupportInitialize)this.plu_ColbindingSource1).BeginInit();
		((System.ComponentModel.ISupportInitialize)this.excelDefaultBindingSource).BeginInit();
		((System.ComponentModel.ISupportInitialize)this.bindingNavigator1).BeginInit();
		this.bindingNavigator1.SuspendLayout();
		base.SuspendLayout();
		resources.ApplyResources(this.splitContainer, "splitContainer");
		this.splitContainer.Name = "splitContainer";
		this.splitContainer.Panel1.Controls.Add(this.splitContainer1);
		resources.ApplyResources(this.splitContainer.Panel2, "splitContainer.Panel2");
		this.splitContainer.Panel2.Controls.Add(this.saveButton);
		this.splitContainer.Panel2.Controls.Add(this.exeButton);
		this.splitContainer.Panel2.Controls.Add(this.openButton);
		resources.ApplyResources(this.splitContainer1, "splitContainer1");
		this.splitContainer1.Name = "splitContainer1";
		this.splitContainer1.Panel1.Controls.Add(this.excelDataGridView);
		this.splitContainer1.Panel1.Controls.Add(this.bindingNavigator);
		resources.ApplyResources(this.splitContainer1.Panel2, "splitContainer1.Panel2");
		this.splitContainer1.Panel2.Controls.Add(this.excelDefaultDataGridView);
		this.splitContainer1.Panel2.Controls.Add(this.bindingNavigator1);
		this.excelDataGridView.AllowUserToAddRows = false;
		this.excelDataGridView.AutoGenerateColumns = false;
		this.excelDataGridView.BackgroundColor = System.Drawing.SystemColors.Window;
		this.excelDataGridView.BorderStyle = System.Windows.Forms.BorderStyle.Fixed3D;
		this.excelDataGridView.ColumnHeadersHeightSizeMode = System.Windows.Forms.DataGridViewColumnHeadersHeightSizeMode.AutoSize;
		this.excelDataGridView.Columns.AddRange(this.idColumn, this.fieldColumn);
		this.excelDataGridView.DataSource = this.excelBindingSource;
		resources.ApplyResources(this.excelDataGridView, "excelDataGridView");
		this.excelDataGridView.Name = "excelDataGridView";
		this.excelDataGridView.RowTemplate.Height = 23;
		this.excelDataGridView.SelectionMode = System.Windows.Forms.DataGridViewSelectionMode.FullRowSelect;
		this.idColumn.DataPropertyName = "ID";
		resources.ApplyResources(this.idColumn, "idColumn");
		this.idColumn.Name = "idColumn";
		this.fieldColumn.AutoSizeMode = System.Windows.Forms.DataGridViewAutoSizeColumnMode.Fill;
		this.fieldColumn.DataPropertyName = "Field";
		this.fieldColumn.DataSource = this.pLU_ColBindingSource;
		this.fieldColumn.DisplayMember = "Display";
		resources.ApplyResources(this.fieldColumn, "fieldColumn");
		this.fieldColumn.Name = "fieldColumn";
		this.fieldColumn.Resizable = System.Windows.Forms.DataGridViewTriState.True;
		this.fieldColumn.ValueMember = "Field";
		this.pLU_ColBindingSource.DataMember = "PLU_Col";
		this.pLU_ColBindingSource.DataSource = this.uiDataSet;
		this.pLU_ColBindingSource.Filter = "[Display] <> '#NULL#'";
		this.uiDataSet.DataSetName = "UIDataSet";
		this.uiDataSet.Locale = new System.Globalization.CultureInfo("zh-CN");
		this.uiDataSet.SchemaSerializationMode = System.Data.SchemaSerializationMode.IncludeSchema;
		this.excelBindingSource.DataMember = "Excel";
		this.excelBindingSource.DataSource = this.ecsDataSet;
		this.ecsDataSet.DataSetName = "ECSDataSet";
		this.ecsDataSet.SchemaSerializationMode = System.Data.SchemaSerializationMode.IncludeSchema;
		this.bindingNavigator.AddNewItem = this.bindingNavigatorAddNewItem;
		this.bindingNavigator.BindingSource = this.excelBindingSource;
		this.bindingNavigator.CountItem = this.bindingNavigatorCountItem;
		this.bindingNavigator.DeleteItem = this.bindingNavigatorDeleteItem;
		this.bindingNavigator.Items.AddRange(new System.Windows.Forms.ToolStripItem[12]
		{
			this.bindingNavigatorMoveFirstItem, this.bindingNavigatorMovePreviousItem, this.bindingNavigatorSeparator, this.bindingNavigatorPositionItem, this.bindingNavigatorCountItem, this.bindingNavigatorSeparator1, this.bindingNavigatorMoveNextItem, this.bindingNavigatorMoveLastItem, this.bindingNavigatorSeparator2, this.bindingNavigatorAddNewItem,
			this.bindingNavigatorDeleteItem, this.clearToolStripButton
		});
		resources.ApplyResources(this.bindingNavigator, "bindingNavigator");
		this.bindingNavigator.MoveFirstItem = this.bindingNavigatorMoveFirstItem;
		this.bindingNavigator.MoveLastItem = this.bindingNavigatorMoveLastItem;
		this.bindingNavigator.MoveNextItem = this.bindingNavigatorMoveNextItem;
		this.bindingNavigator.MovePreviousItem = this.bindingNavigatorMovePreviousItem;
		this.bindingNavigator.Name = "bindingNavigator";
		this.bindingNavigator.PositionItem = this.bindingNavigatorPositionItem;
		this.bindingNavigatorAddNewItem.DisplayStyle = System.Windows.Forms.ToolStripItemDisplayStyle.Image;
		this.bindingNavigatorAddNewItem.Image = ECS.Properties.Resources.bindingNavigatorAddNewItem;
		this.bindingNavigatorAddNewItem.Name = "bindingNavigatorAddNewItem";
		resources.ApplyResources(this.bindingNavigatorAddNewItem, "bindingNavigatorAddNewItem");
		this.bindingNavigatorCountItem.Name = "bindingNavigatorCountItem";
		resources.ApplyResources(this.bindingNavigatorCountItem, "bindingNavigatorCountItem");
		this.bindingNavigatorDeleteItem.DisplayStyle = System.Windows.Forms.ToolStripItemDisplayStyle.Image;
		this.bindingNavigatorDeleteItem.Image = ECS.Properties.Resources.bindingNavigatorDeleteItem;
		this.bindingNavigatorDeleteItem.Name = "bindingNavigatorDeleteItem";
		resources.ApplyResources(this.bindingNavigatorDeleteItem, "bindingNavigatorDeleteItem");
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
		this.clearToolStripButton.Image = ECS.Properties.Resources.New;
		resources.ApplyResources(this.clearToolStripButton, "clearToolStripButton");
		this.clearToolStripButton.Name = "clearToolStripButton";
		this.clearToolStripButton.Click += new System.EventHandler(clearToolStripButton_Click);
		this.excelDefaultDataGridView.AllowUserToAddRows = false;
		this.excelDefaultDataGridView.AutoGenerateColumns = false;
		this.excelDefaultDataGridView.BackgroundColor = System.Drawing.SystemColors.Window;
		this.excelDefaultDataGridView.BorderStyle = System.Windows.Forms.BorderStyle.Fixed3D;
		this.excelDefaultDataGridView.ColumnHeadersHeightSizeMode = System.Windows.Forms.DataGridViewColumnHeadersHeightSizeMode.AutoSize;
		this.excelDefaultDataGridView.Columns.AddRange(this.dataGridViewTextBoxColumn1, this.dataGridViewTextBoxColumn2, this.dataGridViewTextBoxColumn3);
		this.excelDefaultDataGridView.DataSource = this.excelDefaultBindingSource;
		resources.ApplyResources(this.excelDefaultDataGridView, "excelDefaultDataGridView");
		this.excelDefaultDataGridView.Name = "excelDefaultDataGridView";
		this.excelDefaultDataGridView.RowTemplate.Height = 23;
		this.excelDefaultDataGridView.SelectionMode = System.Windows.Forms.DataGridViewSelectionMode.FullRowSelect;
		this.dataGridViewTextBoxColumn1.DataPropertyName = "ID";
		resources.ApplyResources(this.dataGridViewTextBoxColumn1, "dataGridViewTextBoxColumn1");
		this.dataGridViewTextBoxColumn1.Name = "dataGridViewTextBoxColumn1";
		this.dataGridViewTextBoxColumn2.AutoSizeMode = System.Windows.Forms.DataGridViewAutoSizeColumnMode.Fill;
		this.dataGridViewTextBoxColumn2.DataPropertyName = "Field";
		this.dataGridViewTextBoxColumn2.DataSource = this.plu_ColbindingSource1;
		this.dataGridViewTextBoxColumn2.DisplayMember = "Display";
		resources.ApplyResources(this.dataGridViewTextBoxColumn2, "dataGridViewTextBoxColumn2");
		this.dataGridViewTextBoxColumn2.Name = "dataGridViewTextBoxColumn2";
		this.dataGridViewTextBoxColumn2.Resizable = System.Windows.Forms.DataGridViewTriState.True;
		this.dataGridViewTextBoxColumn2.SortMode = System.Windows.Forms.DataGridViewColumnSortMode.Automatic;
		this.dataGridViewTextBoxColumn2.ValueMember = "Field";
		this.plu_ColbindingSource1.DataMember = "PLU_Col";
		this.plu_ColbindingSource1.DataSource = this.uiDataSet;
		this.plu_ColbindingSource1.Filter = "[Field] <> '' AND [Field] <> 'PLUID' AND [Display] <> '#NULL#'";
		this.dataGridViewTextBoxColumn3.AutoSizeMode = System.Windows.Forms.DataGridViewAutoSizeColumnMode.Fill;
		this.dataGridViewTextBoxColumn3.DataPropertyName = "Default";
		resources.ApplyResources(this.dataGridViewTextBoxColumn3, "dataGridViewTextBoxColumn3");
		this.dataGridViewTextBoxColumn3.Name = "dataGridViewTextBoxColumn3";
		this.excelDefaultBindingSource.DataMember = "ExcelDefault";
		this.excelDefaultBindingSource.DataSource = this.ecsDataSet;
		this.bindingNavigator1.AddNewItem = this.toolStripButton1;
		this.bindingNavigator1.BindingSource = this.excelDefaultBindingSource;
		this.bindingNavigator1.CountItem = this.toolStripLabel1;
		this.bindingNavigator1.DeleteItem = this.toolStripButton2;
		this.bindingNavigator1.Items.AddRange(new System.Windows.Forms.ToolStripItem[12]
		{
			this.toolStripButton3, this.toolStripButton4, this.toolStripSeparator1, this.toolStripTextBox1, this.toolStripLabel1, this.toolStripSeparator2, this.toolStripButton5, this.toolStripButton6, this.toolStripSeparator3, this.toolStripButton1,
			this.toolStripButton2, this.toolStripButton7
		});
		resources.ApplyResources(this.bindingNavigator1, "bindingNavigator1");
		this.bindingNavigator1.MoveFirstItem = this.toolStripButton3;
		this.bindingNavigator1.MoveLastItem = this.toolStripButton6;
		this.bindingNavigator1.MoveNextItem = this.toolStripButton5;
		this.bindingNavigator1.MovePreviousItem = this.toolStripButton4;
		this.bindingNavigator1.Name = "bindingNavigator1";
		this.bindingNavigator1.PositionItem = this.toolStripTextBox1;
		this.toolStripButton1.DisplayStyle = System.Windows.Forms.ToolStripItemDisplayStyle.Image;
		this.toolStripButton1.Image = ECS.Properties.Resources.bindingNavigatorAddNewItem;
		this.toolStripButton1.Name = "toolStripButton1";
		resources.ApplyResources(this.toolStripButton1, "toolStripButton1");
		this.toolStripLabel1.Name = "toolStripLabel1";
		resources.ApplyResources(this.toolStripLabel1, "toolStripLabel1");
		this.toolStripButton2.DisplayStyle = System.Windows.Forms.ToolStripItemDisplayStyle.Image;
		this.toolStripButton2.Image = ECS.Properties.Resources.bindingNavigatorDeleteItem;
		this.toolStripButton2.Name = "toolStripButton2";
		resources.ApplyResources(this.toolStripButton2, "toolStripButton2");
		this.toolStripButton3.DisplayStyle = System.Windows.Forms.ToolStripItemDisplayStyle.Image;
		this.toolStripButton3.Image = ECS.Properties.Resources.bindingNavigatorMoveFirstItem;
		this.toolStripButton3.Name = "toolStripButton3";
		resources.ApplyResources(this.toolStripButton3, "toolStripButton3");
		this.toolStripButton4.DisplayStyle = System.Windows.Forms.ToolStripItemDisplayStyle.Image;
		this.toolStripButton4.Image = ECS.Properties.Resources.bindingNavigatorMovePreviousItem;
		this.toolStripButton4.Name = "toolStripButton4";
		resources.ApplyResources(this.toolStripButton4, "toolStripButton4");
		this.toolStripSeparator1.Name = "toolStripSeparator1";
		resources.ApplyResources(this.toolStripSeparator1, "toolStripSeparator1");
		resources.ApplyResources(this.toolStripTextBox1, "toolStripTextBox1");
		this.toolStripTextBox1.Name = "toolStripTextBox1";
		this.toolStripSeparator2.Name = "toolStripSeparator2";
		resources.ApplyResources(this.toolStripSeparator2, "toolStripSeparator2");
		this.toolStripButton5.DisplayStyle = System.Windows.Forms.ToolStripItemDisplayStyle.Image;
		this.toolStripButton5.Image = ECS.Properties.Resources.bindingNavigatorMoveNextItem;
		this.toolStripButton5.Name = "toolStripButton5";
		resources.ApplyResources(this.toolStripButton5, "toolStripButton5");
		this.toolStripButton6.DisplayStyle = System.Windows.Forms.ToolStripItemDisplayStyle.Image;
		this.toolStripButton6.Image = ECS.Properties.Resources.bindingNavigatorMoveLastItem;
		this.toolStripButton6.Name = "toolStripButton6";
		resources.ApplyResources(this.toolStripButton6, "toolStripButton6");
		this.toolStripSeparator3.Name = "toolStripSeparator3";
		resources.ApplyResources(this.toolStripSeparator3, "toolStripSeparator3");
		this.toolStripButton7.Image = ECS.Properties.Resources.New;
		resources.ApplyResources(this.toolStripButton7, "toolStripButton7");
		this.toolStripButton7.Name = "toolStripButton7";
		this.toolStripButton7.Click += new System.EventHandler(toolStripButton7_Click);
		resources.ApplyResources(this.saveButton, "saveButton");
		this.saveButton.Name = "saveButton";
		this.saveButton.UseVisualStyleBackColor = true;
		this.saveButton.CheckedChanged += new System.EventHandler(saveButton_CheckedChanged);
		resources.ApplyResources(this.exeButton, "exeButton");
		this.exeButton.Name = "exeButton";
		this.exeButton.UseVisualStyleBackColor = true;
		this.exeButton.Click += new System.EventHandler(exeButton_Click);
		resources.ApplyResources(this.openButton, "openButton");
		this.openButton.Name = "openButton";
		this.openButton.UseVisualStyleBackColor = true;
		this.openButton.CheckedChanged += new System.EventHandler(saveButton_CheckedChanged);
		this.pLUTableAdapter.ClearBeforeFill = true;
		this.excelTableAdapter.ClearBeforeFill = true;
		this.excelDefaultTableAdapter.ClearBeforeFill = true;
		base.AcceptButton = this.exeButton;
		resources.ApplyResources(this, "$this");
		base.AutoScaleMode = System.Windows.Forms.AutoScaleMode.Font;
		base.Controls.Add(this.splitContainer);
		base.Name = "ExcelForm";
		base.ShowIcon = false;
		base.ShowInTaskbar = false;
		base.FormClosed += new System.Windows.Forms.FormClosedEventHandler(ExcelForm_FormClosed);
		base.Load += new System.EventHandler(ExcelForm_Load);
		this.splitContainer.Panel1.ResumeLayout(false);
		this.splitContainer.Panel2.ResumeLayout(false);
		this.splitContainer.Panel2.PerformLayout();
		this.splitContainer.ResumeLayout(false);
		this.splitContainer1.Panel1.ResumeLayout(false);
		this.splitContainer1.Panel1.PerformLayout();
		this.splitContainer1.Panel2.ResumeLayout(false);
		this.splitContainer1.Panel2.PerformLayout();
		this.splitContainer1.ResumeLayout(false);
		((System.ComponentModel.ISupportInitialize)this.excelDataGridView).EndInit();
		((System.ComponentModel.ISupportInitialize)this.pLU_ColBindingSource).EndInit();
		((System.ComponentModel.ISupportInitialize)this.uiDataSet).EndInit();
		((System.ComponentModel.ISupportInitialize)this.excelBindingSource).EndInit();
		((System.ComponentModel.ISupportInitialize)this.ecsDataSet).EndInit();
		((System.ComponentModel.ISupportInitialize)this.bindingNavigator).EndInit();
		this.bindingNavigator.ResumeLayout(false);
		this.bindingNavigator.PerformLayout();
		((System.ComponentModel.ISupportInitialize)this.excelDefaultDataGridView).EndInit();
		((System.ComponentModel.ISupportInitialize)this.plu_ColbindingSource1).EndInit();
		((System.ComponentModel.ISupportInitialize)this.excelDefaultBindingSource).EndInit();
		((System.ComponentModel.ISupportInitialize)this.bindingNavigator1).EndInit();
		this.bindingNavigator1.ResumeLayout(false);
		this.bindingNavigator1.PerformLayout();
		base.ResumeLayout(false);
	}

	public ExcelForm()
	{
		InitializeComponent();
	}

	private void ExcelForm_Load(object sender, EventArgs e)
	{
		Text = Program.GetLang("pw_ExcelCSVImport_Export");
		bindingNavigatorAddNewItem.Text = Program.GetLang("pw_AddNew");
		bindingNavigatorDeleteItem.Text = Program.GetLang("pw_Delete");
		bindingNavigatorMoveFirstItem.Text = Program.GetLang("pw_Firstrecord");
		bindingNavigatorMoveLastItem.Text = Program.GetLang("pw_LastRecord");
		bindingNavigatorMoveNextItem.Text = Program.GetLang("pw_NextRecord");
		bindingNavigatorMovePreviousItem.Text = Program.GetLang("pw_PreviousRecord");
		clearToolStripButton.Text = Program.GetLang("pw_ClearAll");
		dataGridViewTextBoxColumn2.HeaderText = Program.GetLang("pw_FieldName");
		dataGridViewTextBoxColumn3.HeaderText = Program.GetLang("pw_DefaultValue");
		exeButton.Text = Program.GetLang("pw_Import_Export");
		fieldColumn.HeaderText = Program.GetLang("pw_FieldName");
		openButton.Text = Program.GetLang("pw_Import_ToSoftware_");
		saveButton.Text = Program.GetLang("pw_Export_ToExcel_CSV_");
		toolStripButton1.Text = Program.GetLang("pw_AddNew");
		toolStripButton2.Text = Program.GetLang("pw_Delete");
		toolStripButton3.Text = Program.GetLang("pw_Firstrecord");
		toolStripButton4.Text = Program.GetLang("pw_PreviousRecord");
		toolStripButton5.Text = Program.GetLang("pw_NextRecord");
		toolStripButton6.Text = Program.GetLang("pw_LastRecord");
		toolStripButton7.Text = Program.GetLang("pw_ClearAll");
		Font = Settings.Default.CustomFont;
		string fileName = Application.StartupPath + "\\Combo.xml";
		uiDataSet.PLU_Col.ReadXml(fileName);
		excelTableAdapter.Fill(ecsDataSet.Excel);
		excelDefaultTableAdapter.Fill(ecsDataSet.ExcelDefault);
		RDS.DataSet_Init_Unit(ref ecsDataSet);
	}

	private static bool SetField(DataRow row, string field, object source)
	{
		string text = source.ToString().Trim();
		try
		{
			if (row[field].GetType() == typeof(int))
			{
				row[field] = int.Parse(text);
				return true;
			}
			if (row[field].GetType() == typeof(string))
			{
				row[field] = text;
				return true;
			}
			if (row[field].GetType() == typeof(decimal))
			{
				row[field] = decimal.Parse(text.TrimStart('$'), NumberStyles.Currency);
				return true;
			}
			if (row[field].GetType() == typeof(bool))
			{
				if (text == "1" || text.ToLower() == "true")
				{
					row[field] = true;
					return true;
				}
				if (text == "0" || text.ToLower() == "false")
				{
					row[field] = false;
					return true;
				}
				return false;
			}
			return false;
		}
		catch
		{
			return false;
		}
	}

	private bool FillFields(OleDbDataReader reader, DataRow row)
	{
		try
		{
			for (int i = 0; i < Math.Min(excelBindingSource.Count, reader.FieldCount); i++)
			{
				DataRowView dataRowView = (DataRowView)excelBindingSource[i];
				ECSDataSet.ExcelRow excelRow = (ECSDataSet.ExcelRow)dataRowView.Row;
				if (string.IsNullOrEmpty(excelRow.Field))
				{
					continue;
				}
				if (excelRow.Field == "[Unit].[Name]")
				{
					string text = reader[i].ToString();
					DataRow[] array = ecsDataSet.Unit.Select($"[Name] = '{text}'");
					if (array.Length > 0)
					{
						row["UnitID"] = array[0]["UnitID"];
						continue;
					}
					row["UnitID"] = 2;
					row["Text7"] = text;
					row["Flag"] = 1;
				}
				else if (excelRow.Field == "PC_UD_Plus")
				{
					if (!SetField(row, "PC_UD", reader[i]))
					{
						return false;
					}
					if ((int)row["PC_UD"] >= 1)
					{
						row["PS_UD"] = 1;
					}
					else
					{
						row["PS_UD"] = 0;
					}
				}
				else if (excelRow.Field == "UnitID")
				{
					string text2 = reader[i].ToString().Trim();
					if (UnitTable == null || UnitTable.Length <= 1)
					{
						row["UnitID"] = int.Parse(text2);
						continue;
					}
					int num = 0;
					while (true)
					{
						if (num >= UnitTable.Length - 1)
						{
							row["UnitID"] = int.Parse(text2);
							break;
						}
						if (text2 == UnitTable[num])
						{
							row["UnitID"] = int.Parse(UnitTable[num + 1]);
							break;
						}
						num += 2;
					}
				}
				else if (!SetField(row, excelRow.Field, reader[i]))
				{
					return false;
				}
			}
		}
		catch (Exception)
		{
		}
		return true;
	}

	private void SetDefaultValues(ECSDataSet dataSet)
	{
		foreach (DataRowView item in excelDefaultBindingSource)
		{
			ECSDataSet.ExcelDefaultRow excelDefaultRow = (ECSDataSet.ExcelDefaultRow)item.Row;
			string text = excelDefaultRow.Default.Trim();
			if (string.IsNullOrEmpty(excelDefaultRow.Field))
			{
				continue;
			}
			if (excelDefaultRow.Field == "[Unit].[Name]")
			{
				DataRow[] array = ecsDataSet.Unit.Select($"[Name] = '{text}'");
				if (array.Length > 0)
				{
					dataSet.PLU.UnitIDColumn.DefaultValue = array[0]["UnitID"];
				}
				continue;
			}
			if (excelDefaultRow.Field == "UnitID" && text.Contains("|"))
			{
				UnitTable = text.Split('|');
				dataSet.PLU.Columns["UnitID"].DefaultValue = Program.ParseInt(UnitTable[UnitTable.Length - 1]);
				continue;
			}
			DataColumn dataColumn = dataSet.PLU.Columns[excelDefaultRow.Field];
			if (dataColumn == null)
			{
				continue;
			}
			try
			{
				if (dataColumn.DataType == typeof(int))
				{
					dataColumn.DefaultValue = int.Parse(text);
				}
				else if (dataColumn.DataType == typeof(string))
				{
					dataColumn.DefaultValue = text;
				}
				else if (dataColumn.DataType == typeof(decimal))
				{
					dataColumn.DefaultValue = decimal.Parse(text.TrimStart('$'), NumberStyles.Currency);
				}
				else if (dataColumn.DataType == typeof(bool))
				{
					if (text == "1" || text.ToLower() == "true")
					{
						dataColumn.DefaultValue = true;
					}
					else if (text == "0" || text.ToLower() == "false")
					{
						dataColumn.DefaultValue = false;
					}
				}
			}
			catch
			{
			}
		}
	}

	private void DataSet_Update(string Type)
	{
		Program.mf.DataSet_Update(Type, "ExcelForm");
	}

	private void OpenFromExcel(string filename)
	{
		try
		{
			Cursor.Current = Cursors.WaitCursor;
			using (ECSDataSet eCSDataSet = new ECSDataSet())
			{
				SetDefaultValues(eCSDataSet);
				if (Path.GetExtension(filename).ToLower().Equals(".xls") || Path.GetExtension(filename).ToLower().Equals(".xlsx"))
				{
					string connectionString = ((!Path.GetExtension(filename).ToLower().Equals(".xls")) ? ("Provider=Microsoft.ACE.OLEDB.12.0;Data Source=" + filename + ";Extended Properties=\"Excel 12.0;HDR=NO;IMEX=1\"") : ("Provider=Microsoft.Jet.OLEDB.4.0;Data Source=" + filename + ";Extended Properties=\"Excel 8.0;HDR=NO;IMEX=1\""));
					using OleDbConnection oleDbConnection = new OleDbConnection(connectionString);
					oleDbConnection.Open();
					DataTable oleDbSchemaTable = oleDbConnection.GetOleDbSchemaTable(OleDbSchemaGuid.Tables, new object[4] { null, null, null, "TABLE" });
					for (int i = 0; i < oleDbSchemaTable.Rows.Count; i++)
					{
						string text = oleDbSchemaTable.Rows[i][2].ToString().Trim();
						if (oleDbSchemaTable.Rows.Count != 1 && !text.EndsWith("$") && !text.EndsWith("$'"))
						{
							continue;
						}
						string cmdText = "SELECT * FROM [" + text + "]";
						OleDbCommand oleDbCommand = new OleDbCommand(cmdText, oleDbConnection);
						using OleDbDataReader oleDbDataReader = oleDbCommand.ExecuteReader();
						while (oleDbDataReader.Read())
						{
							ECSDataSet.PLURow pLURow = eCSDataSet.PLU.NewPLURow();
							if (FillFields(oleDbDataReader, pLURow) && pLURow.PLUID >= Settings.Default.minUserPLUID && eCSDataSet.PLU.FindByPLUID(pLURow.PLUID) == null)
							{
								RDS.NL_PLUImportKeep(pLURow);
								eCSDataSet.PLU.Rows.Add(pLURow.ItemArray);
							}
						}
						oleDbDataReader.Close();
					}
					oleDbConnection.Close();
				}
				else
				{
					string connectionString2 = "Provider=Microsoft.Jet.OLEDB.4.0;Data Source=" + Path.GetDirectoryName(filename) + ";Extended Properties='Text;FMT=Delimited;HDR=NO;IMEX=1;'";
					using OleDbConnection oleDbConnection2 = new OleDbConnection(connectionString2);
					oleDbConnection2.Open();
					OleDbCommand oleDbCommand2 = new OleDbCommand($"SELECT * FROM [{Path.GetFileName(filename)}]", oleDbConnection2);
					using (OleDbDataReader oleDbDataReader2 = oleDbCommand2.ExecuteReader())
					{
						while (oleDbDataReader2.Read())
						{
							ECSDataSet.PLURow pLURow2 = eCSDataSet.PLU.NewPLURow();
							if (FillFields(oleDbDataReader2, pLURow2) && pLURow2.PLUID >= Settings.Default.minUserPLUID && eCSDataSet.PLU.FindByPLUID(pLURow2.PLUID) == null)
							{
								RDS.NL_PLUImportKeep(pLURow2);
								eCSDataSet.PLU.Rows.Add(pLURow2.ItemArray);
							}
						}
						oleDbDataReader2.Close();
					}
					oleDbConnection2.Close();
				}
				ecsDataSet.Merge(eCSDataSet);
			}
			pLUTableAdapter.Update(ecsDataSet.PLU);
			DataSet_Update("PLU");
			MessageBox.Show(this, Program.GetLang("pw_OperationSuccess"), Program.GetLang("pw_TM_xAManagementProgram") + Resources.Version, MessageBoxButtons.OK, MessageBoxIcon.Asterisk);
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
		}
		finally
		{
			Cursor.Current = Cursors.Default;
		}
	}

	private string GetField(string field, string display)
	{
		if (field.Length == 0)
		{
			return string.Empty;
		}
		if (field == "[Unit].[Name]")
		{
			return $"{field} AS [{display}]";
		}
		DataColumn dataColumn = ecsDataSet.PLU.Columns[field];
		if (dataColumn.DataType == typeof(bool))
		{
			return $"IIF([PLU].[{field}], 1, 0) AS [{display}]";
		}
		if (dataColumn.DataType == typeof(decimal))
		{
			return $"CDbl([PLU].[{field}]) AS [{display}]";
		}
		return $"[PLU].[{field}] AS [{display}]";
	}

	private void SaveToExcel(string filename)
	{
		try
		{
			if (File.Exists(filename))
			{
				File.Delete(filename);
			}
			string empty = string.Empty;
			string text = string.Empty;
			string display = string.Empty;
			int i;
			for (i = 0; i < excelBindingSource.Count; i++)
			{
				DataRowView dataRowView = (DataRowView)excelBindingSource[i];
				ECSDataSet.ExcelRow excelRow = (ECSDataSet.ExcelRow)dataRowView.Row;
				text = excelRow.Field;
				if (!string.IsNullOrEmpty(text))
				{
					display = uiDataSet.PLU_Col.FindByField(text).Display;
					break;
				}
			}
			if (i == excelBindingSource.Count)
			{
				return;
			}
			empty += GetField(text, display);
			for (int j = i + 1; j < excelBindingSource.Count; j++)
			{
				DataRowView dataRowView = (DataRowView)excelBindingSource[j];
				ECSDataSet.ExcelRow excelRow = (ECSDataSet.ExcelRow)dataRowView.Row;
				text = excelRow.Field;
				display = uiDataSet.PLU_Col.FindByField(text).Display;
				if (text == "PC_UD_Plus")
				{
					text = "PC_UD";
				}
				if (!string.IsNullOrEmpty(text))
				{
					display = uiDataSet.PLU_Col.FindByField(text).Display;
					empty = empty + "," + GetField(text, display);
				}
			}
			Cursor.Current = Cursors.WaitCursor;
			if (Path.GetExtension(filename).ToLower().Equals(".xls"))
			{
				using OleDbConnection oleDbConnection = new OleDbConnection(Settings.Default.ECSConnectionString);
				OleDbCommand oleDbCommand = new OleDbCommand();
				oleDbCommand.Connection = oleDbConnection;
				oleDbConnection.Open();
				oleDbCommand.CommandText = $"SELECT {empty} INTO [Excel 8.0;Database={filename}].[Sheet1]FROM ([PLU] INNER JOIN [Unit] ON [PLU].[UnitID] = [Unit].[UnitID])WHERE [PLUID] >= {Settings.Default.minUserPLUID} ORDER BY [PLUID]";
				oleDbCommand.ExecuteNonQuery();
				oleDbConnection.Close();
			}
			else
			{
				if (!Path.GetExtension(filename).ToLower().Equals(".csv"))
				{
					throw new IOException("Only .xls and .csv allowed");
				}
				using OleDbConnection oleDbConnection2 = new OleDbConnection(Settings.Default.ECSConnectionString);
				OleDbCommand oleDbCommand2 = new OleDbCommand();
				oleDbCommand2.Connection = oleDbConnection2;
				oleDbConnection2.Open();
				oleDbCommand2.CommandText = string.Format("SELECT {0} INTO [TEXT;Database={1}].[{3}]FROM ([PLU] INNER JOIN [Unit] ON [PLU].[UnitID] = [Unit].[UnitID])WHERE [PLUID] >= {2} ORDER BY [PLUID]", empty, Path.GetDirectoryName(filename), Settings.Default.minUserPLUID, Path.GetFileName(filename));
				oleDbCommand2.ExecuteNonQuery();
				oleDbConnection2.Close();
			}
			MessageBox.Show(this, Program.GetLang("pw_OperationSuccess"), Program.GetLang("pw_TM_xAManagementProgram") + Resources.Version, MessageBoxButtons.OK, MessageBoxIcon.Asterisk);
			base.DialogResult = DialogResult.OK;
			Process.Start(filename);
		}
		catch (Exception ex)
		{
			MessageBox.Show(this, Program.GetLang("pw_Error_OperationFailed") + Environment.NewLine + Environment.NewLine + ex.Message, Program.GetLang("pw_TM_xAManagementProgram") + Resources.Version, MessageBoxButtons.OK, MessageBoxIcon.Hand);
		}
		finally
		{
			Cursor.Current = Cursors.Default;
		}
	}

	private void exeButton_Click(object sender, EventArgs e)
	{
		if (excelBindingSource.Count <= 0)
		{
			return;
		}
		if (saveButton.Checked)
		{
			SaveFileDialog saveFileDialog = new SaveFileDialog();
			saveFileDialog.OverwritePrompt = true;
			saveFileDialog.Filter = Program.GetLang("pw_ExcelFile___XLS____xls_CSVFile___CSV____csv");
			if (saveFileDialog.ShowDialog(this) == DialogResult.OK)
			{
				pLUTableAdapter.ClearBeforeFill = true;
				pLUTableAdapter.Fill(ecsDataSet.PLU);
				SaveToExcel(saveFileDialog.FileName);
			}
		}
		else if (openButton.Checked)
		{
			OpenFileDialog openFileDialog = new OpenFileDialog();
			openFileDialog.CheckFileExists = true;
			openFileDialog.Filter = Program.GetLang("pw_Excel_CSVFile___XLS___XLSX___CSV____xls___xlsx___csv");
			if (openFileDialog.ShowDialog(this) == DialogResult.OK)
			{
				pLUTableAdapter.ClearBeforeFill = true;
				pLUTableAdapter.Fill(ecsDataSet.PLU);
				OpenFromExcel(openFileDialog.FileName);
			}
		}
	}

	private void saveButton_CheckedChanged(object sender, EventArgs e)
	{
		exeButton.Enabled = saveButton.Checked || openButton.Checked;
	}

	private void ExcelForm_FormClosed(object sender, FormClosedEventArgs e)
	{
		Validate();
		try
		{
			excelBindingSource.EndEdit();
			excelDefaultBindingSource.EndEdit();
		}
		catch (Exception ex)
		{
			MessageBox.Show(this, Program.GetLang("pw_Error_OperationFailed") + Environment.NewLine + Environment.NewLine + ex.Message, Program.GetLang("pw_TM_xAManagementProgram") + Resources.Version, MessageBoxButtons.OK, MessageBoxIcon.Hand);
			excelBindingSource.CancelEdit();
		}
		if (ecsDataSet.HasChanges())
		{
			try
			{
				excelTableAdapter.Update(ecsDataSet.Excel);
				excelDefaultTableAdapter.Update(ecsDataSet.ExcelDefault);
				Program.mf.DataSet_Update("Excel", "ExcelForm");
			}
			catch (Exception ex2)
			{
				MessageBox.Show(this, Program.GetLang("pw_Error_OperationFailed") + Environment.NewLine + Environment.NewLine + ex2.Message, Program.GetLang("pw_TM_xAManagementProgram") + Resources.Version, MessageBoxButtons.OK, MessageBoxIcon.Hand);
			}
		}
	}

	private void clearToolStripButton_Click(object sender, EventArgs e)
	{
		foreach (DataRowView item in excelBindingSource)
		{
			item.Row.Delete();
		}
	}

	private void toolStripButton7_Click(object sender, EventArgs e)
	{
		foreach (DataRowView item in excelDefaultBindingSource)
		{
			item.Row.Delete();
		}
	}
}
