using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Data;
using System.Drawing;
using System.Globalization;
using System.Windows.Forms;
using ECS.Properties;

namespace ECS;

public class CustomDesigner : Form
{
	private IContainer components;

	private SplitContainer splitContainer1;

	private DataGridView customDataGridView;

	private BindingSource customBindingSource;

	private UIDataSet uiDataSet;

	private BindingNavigator customBindingNavigator;

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

	private DataGridView customItemDataGridView;

	private BindingSource customItemBindingSource;

	private BindingNavigator customeItemBindingNavigator;

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

	private DataGridViewTextBoxColumn customDisplayColumn;

	private DataGridViewComboBoxColumn customTableColumn;

	private DataGridViewTextBoxColumn customMenuColumn;

	private DataGridViewTextBoxColumn customKeywordColumn;

	private DataGridViewCheckBoxColumn customVisibleColumn;

	private DataGridViewCheckBoxColumn customImportColumn;

	private DataGridViewCheckBoxColumn customExportColumn;

	private DataGridViewTextBoxColumn sspColumn;

	private DataGridViewTextBoxColumn topColumn;

	private DataGridViewTextBoxColumn bottomColumn;

	private DataGridViewTextBoxColumn leftColumn;

	private DataGridViewTextBoxColumn width1Column;

	private DataGridViewTextBoxColumn width2Column;

	private DataGridViewTextBoxColumn Width3;

	private DataGridViewTextBoxColumn Width4;

	private DataGridViewTextBoxColumn Width5;

	private DataGridViewTextBoxColumn Width6;

	private DataGridViewTextBoxColumn customIDColumn;

	private DataGridViewComboBoxColumn customItemTypeColumn;

	private DataGridViewComboBoxColumn customItemFieldColumn;

	private DataGridViewTextBoxColumn customItemWidthColumn;

	private DataGridViewTextBoxColumn customItemDisplayColumn;

	private DataGridViewCheckBoxColumn customItemVisibleColumn;

	private DataGridViewTextBoxColumn customItemGridDisplayColumn;

	private DataGridViewCheckBoxColumn customItemDetailGridVisibleColumn;

	private DataGridViewTextBoxColumn customItemIDColumn;

	private DataGridViewTextBoxColumn customItemItemColumn;

	public CustomDesigner()
	{
		InitializeComponent();
	}

	private void CustomDesigner_Load(object sender, EventArgs e)
	{
		Font = Settings.Default.CustomFont;
		List<Pair> list = new List<Pair>(5);
		list.Add(new Pair(0, "TextBox"));
		list.Add(new Pair(1, "NumberBox"));
		list.Add(new Pair(2, "ComboBox"));
		list.Add(new Pair(3, "CheckBox"));
		list.Add(new Pair(4, "TextOnly"));
		list.Add(new Pair(5, "TextInMain"));
		customItemTypeColumn.DisplayMember = "Display";
		customItemTypeColumn.ValueMember = "Value";
		customItemTypeColumn.DataSource = list;
		string fileName = Application.StartupPath + "\\Custom.xml";
		uiDataSet.ReadXml(fileName);
		uiDataSet.AcceptChanges();
	}

	private void CustomDesigner_FormClosed(object sender, FormClosedEventArgs e)
	{
		Validate();
		customBindingSource.EndEdit();
		customItemBindingSource.EndEdit();
		string fileName = Application.StartupPath + "\\Custom.xml";
		uiDataSet.WriteXml(fileName);
	}

	private void customDataGridView_DataError(object sender, DataGridViewDataErrorEventArgs e)
	{
		e.Cancel = true;
	}

	private void customItemDataGridView_DataError(object sender, DataGridViewDataErrorEventArgs e)
	{
		e.Cancel = true;
	}

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
		System.ComponentModel.ComponentResourceManager resources = new System.ComponentModel.ComponentResourceManager(typeof(ECS.CustomDesigner));
		this.splitContainer1 = new System.Windows.Forms.SplitContainer();
		this.customDataGridView = new System.Windows.Forms.DataGridView();
		this.customDisplayColumn = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.customTableColumn = new System.Windows.Forms.DataGridViewComboBoxColumn();
		this.customMenuColumn = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.customKeywordColumn = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.customVisibleColumn = new System.Windows.Forms.DataGridViewCheckBoxColumn();
		this.customImportColumn = new System.Windows.Forms.DataGridViewCheckBoxColumn();
		this.customExportColumn = new System.Windows.Forms.DataGridViewCheckBoxColumn();
		this.sspColumn = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.topColumn = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.bottomColumn = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.leftColumn = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.width1Column = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.width2Column = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.Width3 = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.Width4 = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.Width5 = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.Width6 = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.customIDColumn = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.customBindingSource = new System.Windows.Forms.BindingSource(this.components);
		this.uiDataSet = new ECS.UIDataSet();
		this.customBindingNavigator = new System.Windows.Forms.BindingNavigator(this.components);
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
		this.customItemDataGridView = new System.Windows.Forms.DataGridView();
		this.customItemBindingSource = new System.Windows.Forms.BindingSource(this.components);
		this.customeItemBindingNavigator = new System.Windows.Forms.BindingNavigator(this.components);
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
		this.customItemTypeColumn = new System.Windows.Forms.DataGridViewComboBoxColumn();
		this.customItemFieldColumn = new System.Windows.Forms.DataGridViewComboBoxColumn();
		this.customItemWidthColumn = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.customItemDisplayColumn = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.customItemVisibleColumn = new System.Windows.Forms.DataGridViewCheckBoxColumn();
		this.customItemGridDisplayColumn = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.customItemDetailGridVisibleColumn = new System.Windows.Forms.DataGridViewCheckBoxColumn();
		this.customItemIDColumn = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.customItemItemColumn = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.splitContainer1.Panel1.SuspendLayout();
		this.splitContainer1.Panel2.SuspendLayout();
		this.splitContainer1.SuspendLayout();
		((System.ComponentModel.ISupportInitialize)this.customDataGridView).BeginInit();
		((System.ComponentModel.ISupportInitialize)this.customBindingSource).BeginInit();
		((System.ComponentModel.ISupportInitialize)this.uiDataSet).BeginInit();
		((System.ComponentModel.ISupportInitialize)this.customBindingNavigator).BeginInit();
		this.customBindingNavigator.SuspendLayout();
		((System.ComponentModel.ISupportInitialize)this.customItemDataGridView).BeginInit();
		((System.ComponentModel.ISupportInitialize)this.customItemBindingSource).BeginInit();
		((System.ComponentModel.ISupportInitialize)this.customeItemBindingNavigator).BeginInit();
		this.customeItemBindingNavigator.SuspendLayout();
		base.SuspendLayout();
		this.splitContainer1.Dock = System.Windows.Forms.DockStyle.Fill;
		this.splitContainer1.Location = new System.Drawing.Point(0, 0);
		this.splitContainer1.Name = "splitContainer1";
		this.splitContainer1.Orientation = System.Windows.Forms.Orientation.Horizontal;
		this.splitContainer1.Panel1.AutoScroll = true;
		this.splitContainer1.Panel1.Controls.Add(this.customDataGridView);
		this.splitContainer1.Panel1.Controls.Add(this.customBindingNavigator);
		this.splitContainer1.Panel2.AutoScroll = true;
		this.splitContainer1.Panel2.Controls.Add(this.customItemDataGridView);
		this.splitContainer1.Panel2.Controls.Add(this.customeItemBindingNavigator);
		this.splitContainer1.Size = new System.Drawing.Size(794, 525);
		this.splitContainer1.SplitterDistance = 246;
		this.splitContainer1.TabIndex = 0;
		this.customDataGridView.AllowUserToAddRows = false;
		this.customDataGridView.AllowUserToDeleteRows = false;
		this.customDataGridView.AutoGenerateColumns = false;
		this.customDataGridView.BackgroundColor = System.Drawing.SystemColors.Window;
		this.customDataGridView.BorderStyle = System.Windows.Forms.BorderStyle.Fixed3D;
		this.customDataGridView.ColumnHeadersHeightSizeMode = System.Windows.Forms.DataGridViewColumnHeadersHeightSizeMode.AutoSize;
		this.customDataGridView.Columns.AddRange(this.customDisplayColumn, this.customTableColumn, this.customMenuColumn, this.customKeywordColumn, this.customVisibleColumn, this.customImportColumn, this.customExportColumn, this.sspColumn, this.topColumn, this.bottomColumn, this.leftColumn, this.width1Column, this.width2Column, this.Width3, this.Width4, this.Width5, this.Width6, this.customIDColumn);
		this.customDataGridView.DataSource = this.customBindingSource;
		this.customDataGridView.Dock = System.Windows.Forms.DockStyle.Fill;
		this.customDataGridView.Location = new System.Drawing.Point(0, 25);
		this.customDataGridView.Name = "customDataGridView";
		this.customDataGridView.RowTemplate.Height = 23;
		this.customDataGridView.Size = new System.Drawing.Size(794, 221);
		this.customDataGridView.TabIndex = 0;
		this.customDataGridView.DataError += new System.Windows.Forms.DataGridViewDataErrorEventHandler(customDataGridView_DataError);
		this.customDisplayColumn.AutoSizeMode = System.Windows.Forms.DataGridViewAutoSizeColumnMode.Fill;
		this.customDisplayColumn.DataPropertyName = "Display";
		this.customDisplayColumn.HeaderText = "Display";
		this.customDisplayColumn.Name = "customDisplayColumn";
		this.customTableColumn.AutoSizeMode = System.Windows.Forms.DataGridViewAutoSizeColumnMode.Fill;
		this.customTableColumn.DataPropertyName = "Table";
		this.customTableColumn.HeaderText = "Table";
		this.customTableColumn.Items.AddRange("Custom1", "Custom2", "Custom3", "Custom4");
		this.customTableColumn.Name = "customTableColumn";
		this.customTableColumn.Resizable = System.Windows.Forms.DataGridViewTriState.True;
		this.customTableColumn.SortMode = System.Windows.Forms.DataGridViewColumnSortMode.Automatic;
		this.customMenuColumn.AutoSizeMode = System.Windows.Forms.DataGridViewAutoSizeColumnMode.Fill;
		this.customMenuColumn.DataPropertyName = "Menu";
		this.customMenuColumn.HeaderText = "Menu";
		this.customMenuColumn.Name = "customMenuColumn";
		this.customKeywordColumn.AutoSizeMode = System.Windows.Forms.DataGridViewAutoSizeColumnMode.Fill;
		this.customKeywordColumn.DataPropertyName = "Keyword";
		this.customKeywordColumn.HeaderText = "Keyword";
		this.customKeywordColumn.Name = "customKeywordColumn";
		this.customVisibleColumn.AutoSizeMode = System.Windows.Forms.DataGridViewAutoSizeColumnMode.Fill;
		this.customVisibleColumn.DataPropertyName = "Visible";
		this.customVisibleColumn.HeaderText = "Visible";
		this.customVisibleColumn.Name = "customVisibleColumn";
		this.customImportColumn.AutoSizeMode = System.Windows.Forms.DataGridViewAutoSizeColumnMode.Fill;
		this.customImportColumn.DataPropertyName = "Import";
		this.customImportColumn.HeaderText = "Import";
		this.customImportColumn.Name = "customImportColumn";
		this.customExportColumn.AutoSizeMode = System.Windows.Forms.DataGridViewAutoSizeColumnMode.Fill;
		this.customExportColumn.DataPropertyName = "Export";
		this.customExportColumn.HeaderText = "Export";
		this.customExportColumn.Name = "customExportColumn";
		this.sspColumn.AutoSizeMode = System.Windows.Forms.DataGridViewAutoSizeColumnMode.Fill;
		this.sspColumn.DataPropertyName = "Ssp";
		this.sspColumn.HeaderText = "Ssp";
		this.sspColumn.Name = "sspColumn";
		this.topColumn.AutoSizeMode = System.Windows.Forms.DataGridViewAutoSizeColumnMode.Fill;
		this.topColumn.DataPropertyName = "Top";
		this.topColumn.HeaderText = "Top";
		this.topColumn.Name = "topColumn";
		this.bottomColumn.AutoSizeMode = System.Windows.Forms.DataGridViewAutoSizeColumnMode.Fill;
		this.bottomColumn.DataPropertyName = "Bottom";
		this.bottomColumn.HeaderText = "Bottom";
		this.bottomColumn.Name = "bottomColumn";
		this.leftColumn.AutoSizeMode = System.Windows.Forms.DataGridViewAutoSizeColumnMode.Fill;
		this.leftColumn.DataPropertyName = "Left";
		this.leftColumn.HeaderText = "Left";
		this.leftColumn.Name = "leftColumn";
		this.width1Column.AutoSizeMode = System.Windows.Forms.DataGridViewAutoSizeColumnMode.Fill;
		this.width1Column.DataPropertyName = "Width1";
		this.width1Column.HeaderText = "Width1";
		this.width1Column.Name = "width1Column";
		this.width2Column.AutoSizeMode = System.Windows.Forms.DataGridViewAutoSizeColumnMode.Fill;
		this.width2Column.DataPropertyName = "Width2";
		this.width2Column.HeaderText = "Width2";
		this.width2Column.Name = "width2Column";
		this.Width3.AutoSizeMode = System.Windows.Forms.DataGridViewAutoSizeColumnMode.Fill;
		this.Width3.DataPropertyName = "Width3";
		this.Width3.HeaderText = "Width3";
		this.Width3.Name = "Width3";
		this.Width4.AutoSizeMode = System.Windows.Forms.DataGridViewAutoSizeColumnMode.Fill;
		this.Width4.DataPropertyName = "Width4";
		this.Width4.HeaderText = "Width4";
		this.Width4.Name = "Width4";
		this.Width5.AutoSizeMode = System.Windows.Forms.DataGridViewAutoSizeColumnMode.Fill;
		this.Width5.DataPropertyName = "Width5";
		this.Width5.HeaderText = "Width5";
		this.Width5.Name = "Width5";
		this.Width6.AutoSizeMode = System.Windows.Forms.DataGridViewAutoSizeColumnMode.Fill;
		this.Width6.DataPropertyName = "Width6";
		this.Width6.HeaderText = "Width6";
		this.Width6.Name = "Width6";
		this.customIDColumn.DataPropertyName = "ID";
		this.customIDColumn.HeaderText = "ID";
		this.customIDColumn.Name = "customIDColumn";
		this.customIDColumn.Visible = false;
		this.customBindingSource.DataMember = "Custom";
		this.customBindingSource.DataSource = this.uiDataSet;
		this.uiDataSet.DataSetName = "UIDataSet";
		this.uiDataSet.Locale = new System.Globalization.CultureInfo("zh-CN");
		this.uiDataSet.SchemaSerializationMode = System.Data.SchemaSerializationMode.IncludeSchema;
		this.customBindingNavigator.AddNewItem = this.bindingNavigatorAddNewItem;
		this.customBindingNavigator.BindingSource = this.customBindingSource;
		this.customBindingNavigator.CountItem = this.bindingNavigatorCountItem;
		this.customBindingNavigator.DeleteItem = this.bindingNavigatorDeleteItem;
		this.customBindingNavigator.Items.AddRange(new System.Windows.Forms.ToolStripItem[11]
		{
			this.bindingNavigatorMoveFirstItem, this.bindingNavigatorMovePreviousItem, this.bindingNavigatorSeparator, this.bindingNavigatorPositionItem, this.bindingNavigatorCountItem, this.bindingNavigatorSeparator1, this.bindingNavigatorMoveNextItem, this.bindingNavigatorMoveLastItem, this.bindingNavigatorSeparator2, this.bindingNavigatorAddNewItem,
			this.bindingNavigatorDeleteItem
		});
		this.customBindingNavigator.Location = new System.Drawing.Point(0, 0);
		this.customBindingNavigator.MoveFirstItem = this.bindingNavigatorMoveFirstItem;
		this.customBindingNavigator.MoveLastItem = this.bindingNavigatorMoveLastItem;
		this.customBindingNavigator.MoveNextItem = this.bindingNavigatorMoveNextItem;
		this.customBindingNavigator.MovePreviousItem = this.bindingNavigatorMovePreviousItem;
		this.customBindingNavigator.Name = "customBindingNavigator";
		this.customBindingNavigator.PositionItem = this.bindingNavigatorPositionItem;
		this.customBindingNavigator.Size = new System.Drawing.Size(794, 25);
		this.customBindingNavigator.TabIndex = 1;
		this.bindingNavigatorAddNewItem.DisplayStyle = System.Windows.Forms.ToolStripItemDisplayStyle.Image;
		this.bindingNavigatorAddNewItem.Image = (System.Drawing.Image)resources.GetObject("bindingNavigatorAddNewItem.Image");
		this.bindingNavigatorAddNewItem.Name = "bindingNavigatorAddNewItem";
		this.bindingNavigatorAddNewItem.RightToLeftAutoMirrorImage = true;
		this.bindingNavigatorAddNewItem.Size = new System.Drawing.Size(23, 22);
		this.bindingNavigatorAddNewItem.Text = "新添";
		this.bindingNavigatorCountItem.Name = "bindingNavigatorCountItem";
		this.bindingNavigatorCountItem.Size = new System.Drawing.Size(35, 22);
		this.bindingNavigatorCountItem.Text = "/ {0}";
		this.bindingNavigatorDeleteItem.DisplayStyle = System.Windows.Forms.ToolStripItemDisplayStyle.Image;
		this.bindingNavigatorDeleteItem.Image = (System.Drawing.Image)resources.GetObject("bindingNavigatorDeleteItem.Image");
		this.bindingNavigatorDeleteItem.Name = "bindingNavigatorDeleteItem";
		this.bindingNavigatorDeleteItem.RightToLeftAutoMirrorImage = true;
		this.bindingNavigatorDeleteItem.Size = new System.Drawing.Size(23, 22);
		this.bindingNavigatorDeleteItem.Text = "删除";
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
		this.customItemDataGridView.AllowUserToAddRows = false;
		this.customItemDataGridView.AllowUserToDeleteRows = false;
		this.customItemDataGridView.AutoGenerateColumns = false;
		this.customItemDataGridView.BackgroundColor = System.Drawing.SystemColors.Window;
		this.customItemDataGridView.BorderStyle = System.Windows.Forms.BorderStyle.Fixed3D;
		this.customItemDataGridView.ColumnHeadersHeightSizeMode = System.Windows.Forms.DataGridViewColumnHeadersHeightSizeMode.AutoSize;
		this.customItemDataGridView.Columns.AddRange(this.customItemTypeColumn, this.customItemFieldColumn, this.customItemWidthColumn, this.customItemDisplayColumn, this.customItemVisibleColumn, this.customItemGridDisplayColumn, this.customItemDetailGridVisibleColumn, this.customItemIDColumn, this.customItemItemColumn);
		this.customItemDataGridView.DataSource = this.customItemBindingSource;
		this.customItemDataGridView.Dock = System.Windows.Forms.DockStyle.Fill;
		this.customItemDataGridView.Location = new System.Drawing.Point(0, 25);
		this.customItemDataGridView.Name = "customItemDataGridView";
		this.customItemDataGridView.RowTemplate.Height = 23;
		this.customItemDataGridView.Size = new System.Drawing.Size(794, 250);
		this.customItemDataGridView.TabIndex = 2;
		this.customItemDataGridView.DataError += new System.Windows.Forms.DataGridViewDataErrorEventHandler(customItemDataGridView_DataError);
		this.customItemBindingSource.DataMember = "FK_Custom_CustomItem";
		this.customItemBindingSource.DataSource = this.customBindingSource;
		this.customeItemBindingNavigator.AddNewItem = this.toolStripButton1;
		this.customeItemBindingNavigator.BindingSource = this.customItemBindingSource;
		this.customeItemBindingNavigator.CountItem = this.toolStripLabel1;
		this.customeItemBindingNavigator.DeleteItem = this.toolStripButton2;
		this.customeItemBindingNavigator.Items.AddRange(new System.Windows.Forms.ToolStripItem[11]
		{
			this.toolStripButton3, this.toolStripButton4, this.toolStripSeparator1, this.toolStripTextBox1, this.toolStripLabel1, this.toolStripSeparator2, this.toolStripButton5, this.toolStripButton6, this.toolStripSeparator3, this.toolStripButton1,
			this.toolStripButton2
		});
		this.customeItemBindingNavigator.Location = new System.Drawing.Point(0, 0);
		this.customeItemBindingNavigator.MoveFirstItem = this.toolStripButton3;
		this.customeItemBindingNavigator.MoveLastItem = this.toolStripButton6;
		this.customeItemBindingNavigator.MoveNextItem = this.toolStripButton5;
		this.customeItemBindingNavigator.MovePreviousItem = this.toolStripButton4;
		this.customeItemBindingNavigator.Name = "customeItemBindingNavigator";
		this.customeItemBindingNavigator.PositionItem = this.toolStripTextBox1;
		this.customeItemBindingNavigator.Size = new System.Drawing.Size(794, 25);
		this.customeItemBindingNavigator.TabIndex = 2;
		this.customeItemBindingNavigator.Text = "bindingNavigator1";
		this.toolStripButton1.DisplayStyle = System.Windows.Forms.ToolStripItemDisplayStyle.Image;
		this.toolStripButton1.Image = (System.Drawing.Image)resources.GetObject("toolStripButton1.Image");
		this.toolStripButton1.Name = "toolStripButton1";
		this.toolStripButton1.RightToLeftAutoMirrorImage = true;
		this.toolStripButton1.Size = new System.Drawing.Size(23, 22);
		this.toolStripButton1.Text = "新添";
		this.toolStripLabel1.Name = "toolStripLabel1";
		this.toolStripLabel1.Size = new System.Drawing.Size(35, 22);
		this.toolStripLabel1.Text = "/ {0}";
		this.toolStripButton2.DisplayStyle = System.Windows.Forms.ToolStripItemDisplayStyle.Image;
		this.toolStripButton2.Image = (System.Drawing.Image)resources.GetObject("toolStripButton2.Image");
		this.toolStripButton2.Name = "toolStripButton2";
		this.toolStripButton2.RightToLeftAutoMirrorImage = true;
		this.toolStripButton2.Size = new System.Drawing.Size(23, 22);
		this.toolStripButton2.Text = "删除";
		this.toolStripButton3.DisplayStyle = System.Windows.Forms.ToolStripItemDisplayStyle.Image;
		this.toolStripButton3.Image = (System.Drawing.Image)resources.GetObject("toolStripButton3.Image");
		this.toolStripButton3.Name = "toolStripButton3";
		this.toolStripButton3.RightToLeftAutoMirrorImage = true;
		this.toolStripButton3.Size = new System.Drawing.Size(23, 22);
		this.toolStripButton3.Text = "移到第一条记录";
		this.toolStripButton4.DisplayStyle = System.Windows.Forms.ToolStripItemDisplayStyle.Image;
		this.toolStripButton4.Image = (System.Drawing.Image)resources.GetObject("toolStripButton4.Image");
		this.toolStripButton4.Name = "toolStripButton4";
		this.toolStripButton4.RightToLeftAutoMirrorImage = true;
		this.toolStripButton4.Size = new System.Drawing.Size(23, 22);
		this.toolStripButton4.Text = "移到上一条记录";
		this.toolStripSeparator1.Name = "toolStripSeparator1";
		this.toolStripSeparator1.Size = new System.Drawing.Size(6, 25);
		this.toolStripTextBox1.AccessibleName = "位置";
		this.toolStripTextBox1.AutoSize = false;
		this.toolStripTextBox1.Name = "toolStripTextBox1";
		this.toolStripTextBox1.Size = new System.Drawing.Size(50, 21);
		this.toolStripTextBox1.Text = "0";
		this.toolStripSeparator2.Name = "toolStripSeparator2";
		this.toolStripSeparator2.Size = new System.Drawing.Size(6, 25);
		this.toolStripButton5.DisplayStyle = System.Windows.Forms.ToolStripItemDisplayStyle.Image;
		this.toolStripButton5.Image = (System.Drawing.Image)resources.GetObject("toolStripButton5.Image");
		this.toolStripButton5.Name = "toolStripButton5";
		this.toolStripButton5.RightToLeftAutoMirrorImage = true;
		this.toolStripButton5.Size = new System.Drawing.Size(23, 22);
		this.toolStripButton5.Text = "移到下一条记录";
		this.toolStripButton6.DisplayStyle = System.Windows.Forms.ToolStripItemDisplayStyle.Image;
		this.toolStripButton6.Image = (System.Drawing.Image)resources.GetObject("toolStripButton6.Image");
		this.toolStripButton6.Name = "toolStripButton6";
		this.toolStripButton6.RightToLeftAutoMirrorImage = true;
		this.toolStripButton6.Size = new System.Drawing.Size(23, 22);
		this.toolStripButton6.Text = "移到最后一条记录";
		this.toolStripSeparator3.Name = "toolStripSeparator3";
		this.toolStripSeparator3.Size = new System.Drawing.Size(6, 25);
		this.customItemTypeColumn.AutoSizeMode = System.Windows.Forms.DataGridViewAutoSizeColumnMode.Fill;
		this.customItemTypeColumn.DataPropertyName = "Type";
		this.customItemTypeColumn.HeaderText = "Type";
		this.customItemTypeColumn.Name = "customItemTypeColumn";
		this.customItemTypeColumn.Resizable = System.Windows.Forms.DataGridViewTriState.True;
		this.customItemTypeColumn.SortMode = System.Windows.Forms.DataGridViewColumnSortMode.Automatic;
		this.customItemFieldColumn.AutoSizeMode = System.Windows.Forms.DataGridViewAutoSizeColumnMode.Fill;
		this.customItemFieldColumn.DataPropertyName = "Field";
		this.customItemFieldColumn.HeaderText = "Field";
		this.customItemFieldColumn.Items.AddRange("NULL", "ID", "Text1", "Text2", "Text3", "Text4", "Text5", "Text6", "Text7", "Text8", "Text9", "Text10", "Text11", "Text12", "Text13", "Text14", "Text15", "Text16", "Text17", "Text18", "Text19", "Text20", "Text21", "Text22", "Text23", "Text24", "Text25", "Text26", "Text27", "Text28", "Text29", "Text30", "Text31", "Text32", "Text33", "Text34", "Text35", "Text36", "Text37", "Text38", "Text39", "Text40", "Int1", "Int2", "Int3", "Int4", "Int5", "Int6", "Int7", "Int8", "Int9", "Int10", "Int11", "Int12", "Int13", "Int14", "Int15", "Int16", "Int17", "Int18", "Int19", "Int20", "Int21", "Int22", "Int23", "Int24", "Int25", "Int26", "Int27", "Int28", "Int29", "Int30", "Int31", "Int32", "Int33", "Int34", "Int35", "Int36", "Int37", "Int38", "Int39", "Int40", "Dec1", "Dec2", "Dec3", "Dec4", "Dec5", "Dec6", "Dec7", "Dec8", "Dec9", "Dec10", "Dec11", "Dec12", "Dec13", "Dec14", "Dec15", "Dec16", "Dec17", "Dec18", "Dec19", "Dec20", "Dec21", "Dec22", "Dec23", "Dec24", "Dec25", "Dec26", "Dec27", "Dec28", "Dec29", "Dec30", "Dec31", "Dec32", "Dec33", "Dec34", "Dec35", "Dec36", "Dec37", "Dec38", "Dec39", "Dec40");
		this.customItemFieldColumn.Name = "customItemFieldColumn";
		this.customItemFieldColumn.Resizable = System.Windows.Forms.DataGridViewTriState.True;
		this.customItemFieldColumn.SortMode = System.Windows.Forms.DataGridViewColumnSortMode.Automatic;
		this.customItemWidthColumn.AutoSizeMode = System.Windows.Forms.DataGridViewAutoSizeColumnMode.Fill;
		this.customItemWidthColumn.DataPropertyName = "Width";
		this.customItemWidthColumn.HeaderText = "Width";
		this.customItemWidthColumn.Name = "customItemWidthColumn";
		this.customItemDisplayColumn.AutoSizeMode = System.Windows.Forms.DataGridViewAutoSizeColumnMode.Fill;
		this.customItemDisplayColumn.DataPropertyName = "Display";
		this.customItemDisplayColumn.HeaderText = "Display";
		this.customItemDisplayColumn.Name = "customItemDisplayColumn";
		this.customItemVisibleColumn.AutoSizeMode = System.Windows.Forms.DataGridViewAutoSizeColumnMode.Fill;
		this.customItemVisibleColumn.DataPropertyName = "Visible";
		this.customItemVisibleColumn.HeaderText = "Visible";
		this.customItemVisibleColumn.Name = "customItemVisibleColumn";
		this.customItemGridDisplayColumn.AutoSizeMode = System.Windows.Forms.DataGridViewAutoSizeColumnMode.Fill;
		this.customItemGridDisplayColumn.DataPropertyName = "GridDisplay";
		this.customItemGridDisplayColumn.HeaderText = "GridDisplay";
		this.customItemGridDisplayColumn.Name = "customItemGridDisplayColumn";
		this.customItemDetailGridVisibleColumn.AutoSizeMode = System.Windows.Forms.DataGridViewAutoSizeColumnMode.Fill;
		this.customItemDetailGridVisibleColumn.DataPropertyName = "GridVisible";
		this.customItemDetailGridVisibleColumn.HeaderText = "GridVisible";
		this.customItemDetailGridVisibleColumn.Name = "customItemDetailGridVisibleColumn";
		this.customItemIDColumn.DataPropertyName = "ID";
		this.customItemIDColumn.HeaderText = "ID";
		this.customItemIDColumn.Name = "customItemIDColumn";
		this.customItemIDColumn.Visible = false;
		this.customItemItemColumn.DataPropertyName = "Item";
		this.customItemItemColumn.HeaderText = "Item";
		this.customItemItemColumn.Name = "customItemItemColumn";
		this.customItemItemColumn.Visible = false;
		base.AutoScaleDimensions = new System.Drawing.SizeF(6f, 12f);
		base.AutoScaleMode = System.Windows.Forms.AutoScaleMode.Font;
		base.ClientSize = new System.Drawing.Size(794, 525);
		base.Controls.Add(this.splitContainer1);
		base.Name = "CustomDesigner";
		base.ShowIcon = false;
		base.ShowInTaskbar = false;
		this.Text = "CustomDesigner";
		base.FormClosed += new System.Windows.Forms.FormClosedEventHandler(CustomDesigner_FormClosed);
		base.Load += new System.EventHandler(CustomDesigner_Load);
		this.splitContainer1.Panel1.ResumeLayout(false);
		this.splitContainer1.Panel1.PerformLayout();
		this.splitContainer1.Panel2.ResumeLayout(false);
		this.splitContainer1.Panel2.PerformLayout();
		this.splitContainer1.ResumeLayout(false);
		((System.ComponentModel.ISupportInitialize)this.customDataGridView).EndInit();
		((System.ComponentModel.ISupportInitialize)this.customBindingSource).EndInit();
		((System.ComponentModel.ISupportInitialize)this.uiDataSet).EndInit();
		((System.ComponentModel.ISupportInitialize)this.customBindingNavigator).EndInit();
		this.customBindingNavigator.ResumeLayout(false);
		this.customBindingNavigator.PerformLayout();
		((System.ComponentModel.ISupportInitialize)this.customItemDataGridView).EndInit();
		((System.ComponentModel.ISupportInitialize)this.customItemBindingSource).EndInit();
		((System.ComponentModel.ISupportInitialize)this.customeItemBindingNavigator).EndInit();
		this.customeItemBindingNavigator.ResumeLayout(false);
		this.customeItemBindingNavigator.PerformLayout();
		base.ResumeLayout(false);
	}
}
