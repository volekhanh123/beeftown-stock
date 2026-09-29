using System;
using System.ComponentModel;
using System.Data;
using System.Drawing;
using System.Globalization;
using System.Windows.Forms;
using ECS.Properties;

namespace ECS;

public class FlagDesigner : Form
{
	private IContainer components;

	private SplitContainer splitContainer1;

	private SplitContainer splitContainer2;

	private DataGridView labelItem_Flag1DataGridView;

	private BindingSource labelItem_Flag1BindingSource;

	private UIDataSet uiDataSet;

	private DataGridView labelItem_Flag3DataGridView;

	private BindingSource labelItem_Flag3BindingSource;

	private BindingNavigator labelItem_Flag3BindingNavigator;

	private ToolStripButton toolStripButton8;

	private ToolStripLabel toolStripLabel2;

	private ToolStripButton toolStripButton9;

	private ToolStripButton toolStripButton10;

	private ToolStripButton toolStripButton11;

	private ToolStripSeparator toolStripSeparator4;

	private ToolStripTextBox toolStripTextBox2;

	private ToolStripSeparator toolStripSeparator5;

	private ToolStripButton toolStripButton12;

	private ToolStripButton toolStripButton13;

	private ToolStripSeparator toolStripSeparator6;

	private BindingNavigator labelItem_Flag1BindingNavigator;

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

	private SplitContainer splitContainer3;

	private DataGridView labelItem_Flag2DataGridView;

	private BindingSource labelItem_Flag2BindingSource;

	private BindingNavigator labelItem_Flag2BindingNavigator;

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

	private DataGridView labelItem_Flag4DataGridView;

	private BindingSource labelItem_Flag4BindingSource;

	private BindingNavigator labelItem_Flag4BindingNavigator;

	private ToolStripButton toolStripButton15;

	private ToolStripLabel toolStripLabel3;

	private ToolStripButton toolStripButton16;

	private ToolStripButton toolStripButton17;

	private ToolStripButton toolStripButton18;

	private ToolStripSeparator toolStripSeparator7;

	private ToolStripTextBox toolStripTextBox3;

	private ToolStripSeparator toolStripSeparator8;

	private ToolStripButton toolStripButton19;

	private ToolStripButton toolStripButton20;

	private ToolStripSeparator toolStripSeparator9;

	private DataGridViewTextBoxColumn dataGridViewTextBoxColumn1;

	private DataGridViewTextBoxColumn dataGridViewTextBoxColumn2;

	private DataGridViewTextBoxColumn dataGridViewTextBoxColumn6;

	private DataGridViewTextBoxColumn dataGridViewTextBoxColumn7;

	private DataGridViewTextBoxColumn dataGridViewTextBoxColumn8;

	private DataGridViewTextBoxColumn dataGridViewTextBoxColumn3;

	private DataGridViewTextBoxColumn dataGridViewTextBoxColumn4;

	private DataGridViewTextBoxColumn dataGridViewTextBoxColumn5;

	private DataGridViewTextBoxColumn dataGridViewTextBoxColumn9;

	private DataGridViewTextBoxColumn dataGridViewTextBoxColumn10;

	private DataGridViewTextBoxColumn dataGridViewTextBoxColumn11;

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
		System.ComponentModel.ComponentResourceManager resources = new System.ComponentModel.ComponentResourceManager(typeof(ECS.FlagDesigner));
		this.splitContainer1 = new System.Windows.Forms.SplitContainer();
		this.splitContainer2 = new System.Windows.Forms.SplitContainer();
		this.labelItem_Flag1DataGridView = new System.Windows.Forms.DataGridView();
		this.dataGridViewTextBoxColumn1 = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.dataGridViewTextBoxColumn2 = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.labelItem_Flag1BindingSource = new System.Windows.Forms.BindingSource(this.components);
		this.uiDataSet = new ECS.UIDataSet();
		this.labelItem_Flag3DataGridView = new System.Windows.Forms.DataGridView();
		this.dataGridViewTextBoxColumn6 = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.dataGridViewTextBoxColumn7 = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.dataGridViewTextBoxColumn8 = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.labelItem_Flag3BindingSource = new System.Windows.Forms.BindingSource(this.components);
		this.labelItem_Flag3BindingNavigator = new System.Windows.Forms.BindingNavigator(this.components);
		this.toolStripButton8 = new System.Windows.Forms.ToolStripButton();
		this.toolStripLabel2 = new System.Windows.Forms.ToolStripLabel();
		this.toolStripButton9 = new System.Windows.Forms.ToolStripButton();
		this.toolStripButton10 = new System.Windows.Forms.ToolStripButton();
		this.toolStripButton11 = new System.Windows.Forms.ToolStripButton();
		this.toolStripSeparator4 = new System.Windows.Forms.ToolStripSeparator();
		this.toolStripTextBox2 = new System.Windows.Forms.ToolStripTextBox();
		this.toolStripSeparator5 = new System.Windows.Forms.ToolStripSeparator();
		this.toolStripButton12 = new System.Windows.Forms.ToolStripButton();
		this.toolStripButton13 = new System.Windows.Forms.ToolStripButton();
		this.toolStripSeparator6 = new System.Windows.Forms.ToolStripSeparator();
		this.labelItem_Flag1BindingNavigator = new System.Windows.Forms.BindingNavigator(this.components);
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
		this.splitContainer3 = new System.Windows.Forms.SplitContainer();
		this.labelItem_Flag2DataGridView = new System.Windows.Forms.DataGridView();
		this.dataGridViewTextBoxColumn3 = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.dataGridViewTextBoxColumn4 = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.dataGridViewTextBoxColumn5 = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.labelItem_Flag2BindingSource = new System.Windows.Forms.BindingSource(this.components);
		this.labelItem_Flag2BindingNavigator = new System.Windows.Forms.BindingNavigator(this.components);
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
		this.labelItem_Flag4DataGridView = new System.Windows.Forms.DataGridView();
		this.dataGridViewTextBoxColumn9 = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.dataGridViewTextBoxColumn10 = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.dataGridViewTextBoxColumn11 = new System.Windows.Forms.DataGridViewTextBoxColumn();
		this.labelItem_Flag4BindingSource = new System.Windows.Forms.BindingSource(this.components);
		this.labelItem_Flag4BindingNavigator = new System.Windows.Forms.BindingNavigator(this.components);
		this.toolStripButton15 = new System.Windows.Forms.ToolStripButton();
		this.toolStripLabel3 = new System.Windows.Forms.ToolStripLabel();
		this.toolStripButton16 = new System.Windows.Forms.ToolStripButton();
		this.toolStripButton17 = new System.Windows.Forms.ToolStripButton();
		this.toolStripButton18 = new System.Windows.Forms.ToolStripButton();
		this.toolStripSeparator7 = new System.Windows.Forms.ToolStripSeparator();
		this.toolStripTextBox3 = new System.Windows.Forms.ToolStripTextBox();
		this.toolStripSeparator8 = new System.Windows.Forms.ToolStripSeparator();
		this.toolStripButton19 = new System.Windows.Forms.ToolStripButton();
		this.toolStripButton20 = new System.Windows.Forms.ToolStripButton();
		this.toolStripSeparator9 = new System.Windows.Forms.ToolStripSeparator();
		this.splitContainer1.Panel1.SuspendLayout();
		this.splitContainer1.Panel2.SuspendLayout();
		this.splitContainer1.SuspendLayout();
		this.splitContainer2.Panel1.SuspendLayout();
		this.splitContainer2.Panel2.SuspendLayout();
		this.splitContainer2.SuspendLayout();
		((System.ComponentModel.ISupportInitialize)this.labelItem_Flag1DataGridView).BeginInit();
		((System.ComponentModel.ISupportInitialize)this.labelItem_Flag1BindingSource).BeginInit();
		((System.ComponentModel.ISupportInitialize)this.uiDataSet).BeginInit();
		((System.ComponentModel.ISupportInitialize)this.labelItem_Flag3DataGridView).BeginInit();
		((System.ComponentModel.ISupportInitialize)this.labelItem_Flag3BindingSource).BeginInit();
		((System.ComponentModel.ISupportInitialize)this.labelItem_Flag3BindingNavigator).BeginInit();
		this.labelItem_Flag3BindingNavigator.SuspendLayout();
		((System.ComponentModel.ISupportInitialize)this.labelItem_Flag1BindingNavigator).BeginInit();
		this.labelItem_Flag1BindingNavigator.SuspendLayout();
		this.splitContainer3.Panel1.SuspendLayout();
		this.splitContainer3.Panel2.SuspendLayout();
		this.splitContainer3.SuspendLayout();
		((System.ComponentModel.ISupportInitialize)this.labelItem_Flag2DataGridView).BeginInit();
		((System.ComponentModel.ISupportInitialize)this.labelItem_Flag2BindingSource).BeginInit();
		((System.ComponentModel.ISupportInitialize)this.labelItem_Flag2BindingNavigator).BeginInit();
		this.labelItem_Flag2BindingNavigator.SuspendLayout();
		((System.ComponentModel.ISupportInitialize)this.labelItem_Flag4DataGridView).BeginInit();
		((System.ComponentModel.ISupportInitialize)this.labelItem_Flag4BindingSource).BeginInit();
		((System.ComponentModel.ISupportInitialize)this.labelItem_Flag4BindingNavigator).BeginInit();
		this.labelItem_Flag4BindingNavigator.SuspendLayout();
		base.SuspendLayout();
		this.splitContainer1.Dock = System.Windows.Forms.DockStyle.Fill;
		this.splitContainer1.Location = new System.Drawing.Point(0, 0);
		this.splitContainer1.Name = "splitContainer1";
		this.splitContainer1.Panel1.Controls.Add(this.splitContainer2);
		this.splitContainer1.Panel1.Controls.Add(this.labelItem_Flag1BindingNavigator);
		this.splitContainer1.Panel2.Controls.Add(this.splitContainer3);
		this.splitContainer1.Size = new System.Drawing.Size(792, 566);
		this.splitContainer1.SplitterDistance = 384;
		this.splitContainer1.TabIndex = 0;
		this.splitContainer2.Dock = System.Windows.Forms.DockStyle.Fill;
		this.splitContainer2.Location = new System.Drawing.Point(0, 25);
		this.splitContainer2.Name = "splitContainer2";
		this.splitContainer2.Orientation = System.Windows.Forms.Orientation.Horizontal;
		this.splitContainer2.Panel1.AutoScroll = true;
		this.splitContainer2.Panel1.Controls.Add(this.labelItem_Flag1DataGridView);
		this.splitContainer2.Panel2.AutoScroll = true;
		this.splitContainer2.Panel2.Controls.Add(this.labelItem_Flag3DataGridView);
		this.splitContainer2.Panel2.Controls.Add(this.labelItem_Flag3BindingNavigator);
		this.splitContainer2.Size = new System.Drawing.Size(384, 541);
		this.splitContainer2.SplitterDistance = 239;
		this.splitContainer2.TabIndex = 0;
		this.labelItem_Flag1DataGridView.AllowUserToAddRows = false;
		this.labelItem_Flag1DataGridView.AllowUserToDeleteRows = false;
		this.labelItem_Flag1DataGridView.AutoGenerateColumns = false;
		this.labelItem_Flag1DataGridView.BackgroundColor = System.Drawing.SystemColors.Window;
		this.labelItem_Flag1DataGridView.BorderStyle = System.Windows.Forms.BorderStyle.Fixed3D;
		this.labelItem_Flag1DataGridView.ColumnHeadersHeightSizeMode = System.Windows.Forms.DataGridViewColumnHeadersHeightSizeMode.AutoSize;
		this.labelItem_Flag1DataGridView.Columns.AddRange(this.dataGridViewTextBoxColumn1, this.dataGridViewTextBoxColumn2);
		this.labelItem_Flag1DataGridView.DataSource = this.labelItem_Flag1BindingSource;
		this.labelItem_Flag1DataGridView.Dock = System.Windows.Forms.DockStyle.Fill;
		this.labelItem_Flag1DataGridView.Location = new System.Drawing.Point(0, 0);
		this.labelItem_Flag1DataGridView.Name = "labelItem_Flag1DataGridView";
		this.labelItem_Flag1DataGridView.RowTemplate.Height = 23;
		this.labelItem_Flag1DataGridView.Size = new System.Drawing.Size(384, 239);
		this.labelItem_Flag1DataGridView.TabIndex = 0;
		this.dataGridViewTextBoxColumn1.AutoSizeMode = System.Windows.Forms.DataGridViewAutoSizeColumnMode.Fill;
		this.dataGridViewTextBoxColumn1.DataPropertyName = "Flag1";
		this.dataGridViewTextBoxColumn1.HeaderText = "Flag1";
		this.dataGridViewTextBoxColumn1.Name = "dataGridViewTextBoxColumn1";
		this.dataGridViewTextBoxColumn2.AutoSizeMode = System.Windows.Forms.DataGridViewAutoSizeColumnMode.Fill;
		this.dataGridViewTextBoxColumn2.DataPropertyName = "Display";
		this.dataGridViewTextBoxColumn2.HeaderText = "Display";
		this.dataGridViewTextBoxColumn2.Name = "dataGridViewTextBoxColumn2";
		this.labelItem_Flag1BindingSource.DataMember = "LabelItem_Flag1";
		this.labelItem_Flag1BindingSource.DataSource = this.uiDataSet;
		this.uiDataSet.DataSetName = "UIDataSet";
		this.uiDataSet.Locale = new System.Globalization.CultureInfo("zh-CN");
		this.uiDataSet.SchemaSerializationMode = System.Data.SchemaSerializationMode.IncludeSchema;
		this.labelItem_Flag3DataGridView.AllowUserToAddRows = false;
		this.labelItem_Flag3DataGridView.AllowUserToDeleteRows = false;
		this.labelItem_Flag3DataGridView.AutoGenerateColumns = false;
		this.labelItem_Flag3DataGridView.BackgroundColor = System.Drawing.SystemColors.Window;
		this.labelItem_Flag3DataGridView.BorderStyle = System.Windows.Forms.BorderStyle.Fixed3D;
		this.labelItem_Flag3DataGridView.ColumnHeadersHeightSizeMode = System.Windows.Forms.DataGridViewColumnHeadersHeightSizeMode.AutoSize;
		this.labelItem_Flag3DataGridView.Columns.AddRange(this.dataGridViewTextBoxColumn6, this.dataGridViewTextBoxColumn7, this.dataGridViewTextBoxColumn8);
		this.labelItem_Flag3DataGridView.DataSource = this.labelItem_Flag3BindingSource;
		this.labelItem_Flag3DataGridView.Dock = System.Windows.Forms.DockStyle.Fill;
		this.labelItem_Flag3DataGridView.Location = new System.Drawing.Point(0, 25);
		this.labelItem_Flag3DataGridView.Name = "labelItem_Flag3DataGridView";
		this.labelItem_Flag3DataGridView.RowTemplate.Height = 23;
		this.labelItem_Flag3DataGridView.Size = new System.Drawing.Size(384, 273);
		this.labelItem_Flag3DataGridView.TabIndex = 0;
		this.dataGridViewTextBoxColumn6.DataPropertyName = "Flag1";
		this.dataGridViewTextBoxColumn6.HeaderText = "Flag1";
		this.dataGridViewTextBoxColumn6.Name = "dataGridViewTextBoxColumn6";
		this.dataGridViewTextBoxColumn6.Visible = false;
		this.dataGridViewTextBoxColumn7.AutoSizeMode = System.Windows.Forms.DataGridViewAutoSizeColumnMode.Fill;
		this.dataGridViewTextBoxColumn7.DataPropertyName = "Flag3";
		this.dataGridViewTextBoxColumn7.HeaderText = "Flag3";
		this.dataGridViewTextBoxColumn7.Name = "dataGridViewTextBoxColumn7";
		this.dataGridViewTextBoxColumn8.AutoSizeMode = System.Windows.Forms.DataGridViewAutoSizeColumnMode.Fill;
		this.dataGridViewTextBoxColumn8.DataPropertyName = "Display";
		this.dataGridViewTextBoxColumn8.HeaderText = "Display";
		this.dataGridViewTextBoxColumn8.Name = "dataGridViewTextBoxColumn8";
		this.labelItem_Flag3BindingSource.DataMember = "LabelItem_Flag1_LabelItem_Flag3";
		this.labelItem_Flag3BindingSource.DataSource = this.labelItem_Flag1BindingSource;
		this.labelItem_Flag3BindingNavigator.AddNewItem = this.toolStripButton8;
		this.labelItem_Flag3BindingNavigator.BindingSource = this.labelItem_Flag3BindingSource;
		this.labelItem_Flag3BindingNavigator.CountItem = this.toolStripLabel2;
		this.labelItem_Flag3BindingNavigator.DeleteItem = this.toolStripButton9;
		this.labelItem_Flag3BindingNavigator.Items.AddRange(new System.Windows.Forms.ToolStripItem[11]
		{
			this.toolStripButton10, this.toolStripButton11, this.toolStripSeparator4, this.toolStripTextBox2, this.toolStripLabel2, this.toolStripSeparator5, this.toolStripButton12, this.toolStripButton13, this.toolStripSeparator6, this.toolStripButton8,
			this.toolStripButton9
		});
		this.labelItem_Flag3BindingNavigator.Location = new System.Drawing.Point(0, 0);
		this.labelItem_Flag3BindingNavigator.MoveFirstItem = this.toolStripButton10;
		this.labelItem_Flag3BindingNavigator.MoveLastItem = this.toolStripButton13;
		this.labelItem_Flag3BindingNavigator.MoveNextItem = this.toolStripButton12;
		this.labelItem_Flag3BindingNavigator.MovePreviousItem = this.toolStripButton11;
		this.labelItem_Flag3BindingNavigator.Name = "labelItem_Flag3BindingNavigator";
		this.labelItem_Flag3BindingNavigator.PositionItem = this.toolStripTextBox2;
		this.labelItem_Flag3BindingNavigator.Size = new System.Drawing.Size(384, 25);
		this.labelItem_Flag3BindingNavigator.TabIndex = 2;
		this.labelItem_Flag3BindingNavigator.Text = "bindingNavigator1";
		this.toolStripButton8.DisplayStyle = System.Windows.Forms.ToolStripItemDisplayStyle.Image;
		this.toolStripButton8.Image = (System.Drawing.Image)resources.GetObject("toolStripButton8.Image");
		this.toolStripButton8.Name = "toolStripButton8";
		this.toolStripButton8.RightToLeftAutoMirrorImage = true;
		this.toolStripButton8.Size = new System.Drawing.Size(23, 22);
		this.toolStripButton8.Text = "新添";
		this.toolStripLabel2.Name = "toolStripLabel2";
		this.toolStripLabel2.Size = new System.Drawing.Size(35, 22);
		this.toolStripLabel2.Text = "/ {0}";
		this.toolStripButton9.DisplayStyle = System.Windows.Forms.ToolStripItemDisplayStyle.Image;
		this.toolStripButton9.Image = (System.Drawing.Image)resources.GetObject("toolStripButton9.Image");
		this.toolStripButton9.Name = "toolStripButton9";
		this.toolStripButton9.RightToLeftAutoMirrorImage = true;
		this.toolStripButton9.Size = new System.Drawing.Size(23, 22);
		this.toolStripButton9.Text = "删除";
		this.toolStripButton10.DisplayStyle = System.Windows.Forms.ToolStripItemDisplayStyle.Image;
		this.toolStripButton10.Image = (System.Drawing.Image)resources.GetObject("toolStripButton10.Image");
		this.toolStripButton10.Name = "toolStripButton10";
		this.toolStripButton10.RightToLeftAutoMirrorImage = true;
		this.toolStripButton10.Size = new System.Drawing.Size(23, 22);
		this.toolStripButton10.Text = "移到第一条记录";
		this.toolStripButton11.DisplayStyle = System.Windows.Forms.ToolStripItemDisplayStyle.Image;
		this.toolStripButton11.Image = (System.Drawing.Image)resources.GetObject("toolStripButton11.Image");
		this.toolStripButton11.Name = "toolStripButton11";
		this.toolStripButton11.RightToLeftAutoMirrorImage = true;
		this.toolStripButton11.Size = new System.Drawing.Size(23, 22);
		this.toolStripButton11.Text = "移到上一条记录";
		this.toolStripSeparator4.Name = "toolStripSeparator4";
		this.toolStripSeparator4.Size = new System.Drawing.Size(6, 25);
		this.toolStripTextBox2.AccessibleName = "位置";
		this.toolStripTextBox2.AutoSize = false;
		this.toolStripTextBox2.Name = "toolStripTextBox2";
		this.toolStripTextBox2.Size = new System.Drawing.Size(50, 21);
		this.toolStripTextBox2.Text = "0";
		this.toolStripSeparator5.Name = "toolStripSeparator5";
		this.toolStripSeparator5.Size = new System.Drawing.Size(6, 25);
		this.toolStripButton12.DisplayStyle = System.Windows.Forms.ToolStripItemDisplayStyle.Image;
		this.toolStripButton12.Image = (System.Drawing.Image)resources.GetObject("toolStripButton12.Image");
		this.toolStripButton12.Name = "toolStripButton12";
		this.toolStripButton12.RightToLeftAutoMirrorImage = true;
		this.toolStripButton12.Size = new System.Drawing.Size(23, 22);
		this.toolStripButton12.Text = "移到下一条记录";
		this.toolStripButton13.DisplayStyle = System.Windows.Forms.ToolStripItemDisplayStyle.Image;
		this.toolStripButton13.Image = (System.Drawing.Image)resources.GetObject("toolStripButton13.Image");
		this.toolStripButton13.Name = "toolStripButton13";
		this.toolStripButton13.RightToLeftAutoMirrorImage = true;
		this.toolStripButton13.Size = new System.Drawing.Size(23, 22);
		this.toolStripButton13.Text = "移到最后一条记录";
		this.toolStripSeparator6.Name = "toolStripSeparator6";
		this.toolStripSeparator6.Size = new System.Drawing.Size(6, 25);
		this.labelItem_Flag1BindingNavigator.AddNewItem = this.bindingNavigatorAddNewItem;
		this.labelItem_Flag1BindingNavigator.BindingSource = this.labelItem_Flag1BindingSource;
		this.labelItem_Flag1BindingNavigator.CountItem = this.bindingNavigatorCountItem;
		this.labelItem_Flag1BindingNavigator.DeleteItem = this.bindingNavigatorDeleteItem;
		this.labelItem_Flag1BindingNavigator.Items.AddRange(new System.Windows.Forms.ToolStripItem[11]
		{
			this.bindingNavigatorMoveFirstItem, this.bindingNavigatorMovePreviousItem, this.bindingNavigatorSeparator, this.bindingNavigatorPositionItem, this.bindingNavigatorCountItem, this.bindingNavigatorSeparator1, this.bindingNavigatorMoveNextItem, this.bindingNavigatorMoveLastItem, this.bindingNavigatorSeparator2, this.bindingNavigatorAddNewItem,
			this.bindingNavigatorDeleteItem
		});
		this.labelItem_Flag1BindingNavigator.Location = new System.Drawing.Point(0, 0);
		this.labelItem_Flag1BindingNavigator.MoveFirstItem = this.bindingNavigatorMoveFirstItem;
		this.labelItem_Flag1BindingNavigator.MoveLastItem = this.bindingNavigatorMoveLastItem;
		this.labelItem_Flag1BindingNavigator.MoveNextItem = this.bindingNavigatorMoveNextItem;
		this.labelItem_Flag1BindingNavigator.MovePreviousItem = this.bindingNavigatorMovePreviousItem;
		this.labelItem_Flag1BindingNavigator.Name = "labelItem_Flag1BindingNavigator";
		this.labelItem_Flag1BindingNavigator.PositionItem = this.bindingNavigatorPositionItem;
		this.labelItem_Flag1BindingNavigator.Size = new System.Drawing.Size(384, 25);
		this.labelItem_Flag1BindingNavigator.TabIndex = 1;
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
		this.splitContainer3.Dock = System.Windows.Forms.DockStyle.Fill;
		this.splitContainer3.Location = new System.Drawing.Point(0, 0);
		this.splitContainer3.Name = "splitContainer3";
		this.splitContainer3.Orientation = System.Windows.Forms.Orientation.Horizontal;
		this.splitContainer3.Panel1.AutoScroll = true;
		this.splitContainer3.Panel1.Controls.Add(this.labelItem_Flag2DataGridView);
		this.splitContainer3.Panel1.Controls.Add(this.labelItem_Flag2BindingNavigator);
		this.splitContainer3.Panel2.Controls.Add(this.labelItem_Flag4DataGridView);
		this.splitContainer3.Panel2.Controls.Add(this.labelItem_Flag4BindingNavigator);
		this.splitContainer3.Size = new System.Drawing.Size(404, 566);
		this.splitContainer3.SplitterDistance = 265;
		this.splitContainer3.TabIndex = 0;
		this.labelItem_Flag2DataGridView.AllowUserToAddRows = false;
		this.labelItem_Flag2DataGridView.AllowUserToDeleteRows = false;
		this.labelItem_Flag2DataGridView.AutoGenerateColumns = false;
		this.labelItem_Flag2DataGridView.BackgroundColor = System.Drawing.SystemColors.Window;
		this.labelItem_Flag2DataGridView.BorderStyle = System.Windows.Forms.BorderStyle.Fixed3D;
		this.labelItem_Flag2DataGridView.ColumnHeadersHeightSizeMode = System.Windows.Forms.DataGridViewColumnHeadersHeightSizeMode.AutoSize;
		this.labelItem_Flag2DataGridView.Columns.AddRange(this.dataGridViewTextBoxColumn3, this.dataGridViewTextBoxColumn4, this.dataGridViewTextBoxColumn5);
		this.labelItem_Flag2DataGridView.DataSource = this.labelItem_Flag2BindingSource;
		this.labelItem_Flag2DataGridView.Dock = System.Windows.Forms.DockStyle.Fill;
		this.labelItem_Flag2DataGridView.Location = new System.Drawing.Point(0, 25);
		this.labelItem_Flag2DataGridView.Name = "labelItem_Flag2DataGridView";
		this.labelItem_Flag2DataGridView.RowTemplate.Height = 23;
		this.labelItem_Flag2DataGridView.Size = new System.Drawing.Size(404, 240);
		this.labelItem_Flag2DataGridView.TabIndex = 0;
		this.dataGridViewTextBoxColumn3.DataPropertyName = "Flag1";
		this.dataGridViewTextBoxColumn3.HeaderText = "Flag1";
		this.dataGridViewTextBoxColumn3.Name = "dataGridViewTextBoxColumn3";
		this.dataGridViewTextBoxColumn3.Visible = false;
		this.dataGridViewTextBoxColumn4.AutoSizeMode = System.Windows.Forms.DataGridViewAutoSizeColumnMode.Fill;
		this.dataGridViewTextBoxColumn4.DataPropertyName = "Flag2";
		this.dataGridViewTextBoxColumn4.HeaderText = "Flag2";
		this.dataGridViewTextBoxColumn4.Name = "dataGridViewTextBoxColumn4";
		this.dataGridViewTextBoxColumn5.AutoSizeMode = System.Windows.Forms.DataGridViewAutoSizeColumnMode.Fill;
		this.dataGridViewTextBoxColumn5.DataPropertyName = "Display";
		this.dataGridViewTextBoxColumn5.HeaderText = "Display";
		this.dataGridViewTextBoxColumn5.Name = "dataGridViewTextBoxColumn5";
		this.labelItem_Flag2BindingSource.DataMember = "LabelItem_Flag1_LabelItem_Flag2";
		this.labelItem_Flag2BindingSource.DataSource = this.labelItem_Flag1BindingSource;
		this.labelItem_Flag2BindingNavigator.AddNewItem = this.toolStripButton1;
		this.labelItem_Flag2BindingNavigator.BindingSource = this.labelItem_Flag2BindingSource;
		this.labelItem_Flag2BindingNavigator.CountItem = this.toolStripLabel1;
		this.labelItem_Flag2BindingNavigator.DeleteItem = this.toolStripButton2;
		this.labelItem_Flag2BindingNavigator.Items.AddRange(new System.Windows.Forms.ToolStripItem[11]
		{
			this.toolStripButton3, this.toolStripButton4, this.toolStripSeparator1, this.toolStripTextBox1, this.toolStripLabel1, this.toolStripSeparator2, this.toolStripButton5, this.toolStripButton6, this.toolStripSeparator3, this.toolStripButton1,
			this.toolStripButton2
		});
		this.labelItem_Flag2BindingNavigator.Location = new System.Drawing.Point(0, 0);
		this.labelItem_Flag2BindingNavigator.MoveFirstItem = this.toolStripButton3;
		this.labelItem_Flag2BindingNavigator.MoveLastItem = this.toolStripButton6;
		this.labelItem_Flag2BindingNavigator.MoveNextItem = this.toolStripButton5;
		this.labelItem_Flag2BindingNavigator.MovePreviousItem = this.toolStripButton4;
		this.labelItem_Flag2BindingNavigator.Name = "labelItem_Flag2BindingNavigator";
		this.labelItem_Flag2BindingNavigator.PositionItem = this.toolStripTextBox1;
		this.labelItem_Flag2BindingNavigator.Size = new System.Drawing.Size(404, 25);
		this.labelItem_Flag2BindingNavigator.TabIndex = 2;
		this.labelItem_Flag2BindingNavigator.Text = "bindingNavigator1";
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
		this.labelItem_Flag4DataGridView.AllowUserToAddRows = false;
		this.labelItem_Flag4DataGridView.AllowUserToDeleteRows = false;
		this.labelItem_Flag4DataGridView.AutoGenerateColumns = false;
		this.labelItem_Flag4DataGridView.BackgroundColor = System.Drawing.SystemColors.Window;
		this.labelItem_Flag4DataGridView.BorderStyle = System.Windows.Forms.BorderStyle.Fixed3D;
		this.labelItem_Flag4DataGridView.ColumnHeadersHeightSizeMode = System.Windows.Forms.DataGridViewColumnHeadersHeightSizeMode.AutoSize;
		this.labelItem_Flag4DataGridView.Columns.AddRange(this.dataGridViewTextBoxColumn9, this.dataGridViewTextBoxColumn10, this.dataGridViewTextBoxColumn11);
		this.labelItem_Flag4DataGridView.DataSource = this.labelItem_Flag4BindingSource;
		this.labelItem_Flag4DataGridView.Dock = System.Windows.Forms.DockStyle.Fill;
		this.labelItem_Flag4DataGridView.Location = new System.Drawing.Point(0, 25);
		this.labelItem_Flag4DataGridView.Name = "labelItem_Flag4DataGridView";
		this.labelItem_Flag4DataGridView.RowTemplate.Height = 23;
		this.labelItem_Flag4DataGridView.Size = new System.Drawing.Size(404, 272);
		this.labelItem_Flag4DataGridView.TabIndex = 0;
		this.dataGridViewTextBoxColumn9.DataPropertyName = "Flag2";
		this.dataGridViewTextBoxColumn9.HeaderText = "Flag2";
		this.dataGridViewTextBoxColumn9.Name = "dataGridViewTextBoxColumn9";
		this.dataGridViewTextBoxColumn9.Visible = false;
		this.dataGridViewTextBoxColumn10.AutoSizeMode = System.Windows.Forms.DataGridViewAutoSizeColumnMode.Fill;
		this.dataGridViewTextBoxColumn10.DataPropertyName = "Flag4";
		this.dataGridViewTextBoxColumn10.HeaderText = "Flag4";
		this.dataGridViewTextBoxColumn10.Name = "dataGridViewTextBoxColumn10";
		this.dataGridViewTextBoxColumn11.AutoSizeMode = System.Windows.Forms.DataGridViewAutoSizeColumnMode.Fill;
		this.dataGridViewTextBoxColumn11.DataPropertyName = "Display";
		this.dataGridViewTextBoxColumn11.HeaderText = "Display";
		this.dataGridViewTextBoxColumn11.Name = "dataGridViewTextBoxColumn11";
		this.labelItem_Flag4BindingSource.DataMember = "LabelItem_Flag2_LabelItem_Flag4";
		this.labelItem_Flag4BindingSource.DataSource = this.labelItem_Flag2BindingSource;
		this.labelItem_Flag4BindingNavigator.AddNewItem = this.toolStripButton15;
		this.labelItem_Flag4BindingNavigator.BindingSource = this.labelItem_Flag4BindingSource;
		this.labelItem_Flag4BindingNavigator.CountItem = this.toolStripLabel3;
		this.labelItem_Flag4BindingNavigator.DeleteItem = this.toolStripButton16;
		this.labelItem_Flag4BindingNavigator.Items.AddRange(new System.Windows.Forms.ToolStripItem[11]
		{
			this.toolStripButton17, this.toolStripButton18, this.toolStripSeparator7, this.toolStripTextBox3, this.toolStripLabel3, this.toolStripSeparator8, this.toolStripButton19, this.toolStripButton20, this.toolStripSeparator9, this.toolStripButton15,
			this.toolStripButton16
		});
		this.labelItem_Flag4BindingNavigator.Location = new System.Drawing.Point(0, 0);
		this.labelItem_Flag4BindingNavigator.MoveFirstItem = this.toolStripButton17;
		this.labelItem_Flag4BindingNavigator.MoveLastItem = this.toolStripButton20;
		this.labelItem_Flag4BindingNavigator.MoveNextItem = this.toolStripButton19;
		this.labelItem_Flag4BindingNavigator.MovePreviousItem = this.toolStripButton18;
		this.labelItem_Flag4BindingNavigator.Name = "labelItem_Flag4BindingNavigator";
		this.labelItem_Flag4BindingNavigator.PositionItem = this.toolStripTextBox3;
		this.labelItem_Flag4BindingNavigator.Size = new System.Drawing.Size(404, 25);
		this.labelItem_Flag4BindingNavigator.TabIndex = 2;
		this.labelItem_Flag4BindingNavigator.Text = "bindingNavigator1";
		this.toolStripButton15.DisplayStyle = System.Windows.Forms.ToolStripItemDisplayStyle.Image;
		this.toolStripButton15.Image = (System.Drawing.Image)resources.GetObject("toolStripButton15.Image");
		this.toolStripButton15.Name = "toolStripButton15";
		this.toolStripButton15.RightToLeftAutoMirrorImage = true;
		this.toolStripButton15.Size = new System.Drawing.Size(23, 22);
		this.toolStripButton15.Text = "新添";
		this.toolStripLabel3.Name = "toolStripLabel3";
		this.toolStripLabel3.Size = new System.Drawing.Size(35, 22);
		this.toolStripLabel3.Text = "/ {0}";
		this.toolStripButton16.DisplayStyle = System.Windows.Forms.ToolStripItemDisplayStyle.Image;
		this.toolStripButton16.Image = (System.Drawing.Image)resources.GetObject("toolStripButton16.Image");
		this.toolStripButton16.Name = "toolStripButton16";
		this.toolStripButton16.RightToLeftAutoMirrorImage = true;
		this.toolStripButton16.Size = new System.Drawing.Size(23, 22);
		this.toolStripButton16.Text = "删除";
		this.toolStripButton17.DisplayStyle = System.Windows.Forms.ToolStripItemDisplayStyle.Image;
		this.toolStripButton17.Image = (System.Drawing.Image)resources.GetObject("toolStripButton17.Image");
		this.toolStripButton17.Name = "toolStripButton17";
		this.toolStripButton17.RightToLeftAutoMirrorImage = true;
		this.toolStripButton17.Size = new System.Drawing.Size(23, 22);
		this.toolStripButton17.Text = "移到第一条记录";
		this.toolStripButton18.DisplayStyle = System.Windows.Forms.ToolStripItemDisplayStyle.Image;
		this.toolStripButton18.Image = (System.Drawing.Image)resources.GetObject("toolStripButton18.Image");
		this.toolStripButton18.Name = "toolStripButton18";
		this.toolStripButton18.RightToLeftAutoMirrorImage = true;
		this.toolStripButton18.Size = new System.Drawing.Size(23, 22);
		this.toolStripButton18.Text = "移到上一条记录";
		this.toolStripSeparator7.Name = "toolStripSeparator7";
		this.toolStripSeparator7.Size = new System.Drawing.Size(6, 25);
		this.toolStripTextBox3.AccessibleName = "位置";
		this.toolStripTextBox3.AutoSize = false;
		this.toolStripTextBox3.Name = "toolStripTextBox3";
		this.toolStripTextBox3.Size = new System.Drawing.Size(50, 21);
		this.toolStripTextBox3.Text = "0";
		this.toolStripSeparator8.Name = "toolStripSeparator8";
		this.toolStripSeparator8.Size = new System.Drawing.Size(6, 25);
		this.toolStripButton19.DisplayStyle = System.Windows.Forms.ToolStripItemDisplayStyle.Image;
		this.toolStripButton19.Image = (System.Drawing.Image)resources.GetObject("toolStripButton19.Image");
		this.toolStripButton19.Name = "toolStripButton19";
		this.toolStripButton19.RightToLeftAutoMirrorImage = true;
		this.toolStripButton19.Size = new System.Drawing.Size(23, 22);
		this.toolStripButton19.Text = "移到下一条记录";
		this.toolStripButton20.DisplayStyle = System.Windows.Forms.ToolStripItemDisplayStyle.Image;
		this.toolStripButton20.Image = (System.Drawing.Image)resources.GetObject("toolStripButton20.Image");
		this.toolStripButton20.Name = "toolStripButton20";
		this.toolStripButton20.RightToLeftAutoMirrorImage = true;
		this.toolStripButton20.Size = new System.Drawing.Size(23, 22);
		this.toolStripButton20.Text = "移到最后一条记录";
		this.toolStripSeparator9.Name = "toolStripSeparator9";
		this.toolStripSeparator9.Size = new System.Drawing.Size(6, 25);
		base.AutoScaleDimensions = new System.Drawing.SizeF(6f, 12f);
		base.AutoScaleMode = System.Windows.Forms.AutoScaleMode.Font;
		base.ClientSize = new System.Drawing.Size(792, 566);
		base.Controls.Add(this.splitContainer1);
		base.Name = "FlagDesigner";
		base.ShowIcon = false;
		base.ShowInTaskbar = false;
		this.Text = "FlagDesigner";
		base.FormClosed += new System.Windows.Forms.FormClosedEventHandler(FlagDesigner_FormClosed);
		base.Load += new System.EventHandler(FlagDesigner_Load);
		this.splitContainer1.Panel1.ResumeLayout(false);
		this.splitContainer1.Panel1.PerformLayout();
		this.splitContainer1.Panel2.ResumeLayout(false);
		this.splitContainer1.ResumeLayout(false);
		this.splitContainer2.Panel1.ResumeLayout(false);
		this.splitContainer2.Panel2.ResumeLayout(false);
		this.splitContainer2.Panel2.PerformLayout();
		this.splitContainer2.ResumeLayout(false);
		((System.ComponentModel.ISupportInitialize)this.labelItem_Flag1DataGridView).EndInit();
		((System.ComponentModel.ISupportInitialize)this.labelItem_Flag1BindingSource).EndInit();
		((System.ComponentModel.ISupportInitialize)this.uiDataSet).EndInit();
		((System.ComponentModel.ISupportInitialize)this.labelItem_Flag3DataGridView).EndInit();
		((System.ComponentModel.ISupportInitialize)this.labelItem_Flag3BindingSource).EndInit();
		((System.ComponentModel.ISupportInitialize)this.labelItem_Flag3BindingNavigator).EndInit();
		this.labelItem_Flag3BindingNavigator.ResumeLayout(false);
		this.labelItem_Flag3BindingNavigator.PerformLayout();
		((System.ComponentModel.ISupportInitialize)this.labelItem_Flag1BindingNavigator).EndInit();
		this.labelItem_Flag1BindingNavigator.ResumeLayout(false);
		this.labelItem_Flag1BindingNavigator.PerformLayout();
		this.splitContainer3.Panel1.ResumeLayout(false);
		this.splitContainer3.Panel1.PerformLayout();
		this.splitContainer3.Panel2.ResumeLayout(false);
		this.splitContainer3.Panel2.PerformLayout();
		this.splitContainer3.ResumeLayout(false);
		((System.ComponentModel.ISupportInitialize)this.labelItem_Flag2DataGridView).EndInit();
		((System.ComponentModel.ISupportInitialize)this.labelItem_Flag2BindingSource).EndInit();
		((System.ComponentModel.ISupportInitialize)this.labelItem_Flag2BindingNavigator).EndInit();
		this.labelItem_Flag2BindingNavigator.ResumeLayout(false);
		this.labelItem_Flag2BindingNavigator.PerformLayout();
		((System.ComponentModel.ISupportInitialize)this.labelItem_Flag4DataGridView).EndInit();
		((System.ComponentModel.ISupportInitialize)this.labelItem_Flag4BindingSource).EndInit();
		((System.ComponentModel.ISupportInitialize)this.labelItem_Flag4BindingNavigator).EndInit();
		this.labelItem_Flag4BindingNavigator.ResumeLayout(false);
		this.labelItem_Flag4BindingNavigator.PerformLayout();
		base.ResumeLayout(false);
	}

	public FlagDesigner()
	{
		InitializeComponent();
	}

	private void FlagDesigner_Load(object sender, EventArgs e)
	{
		Font = Settings.Default.CustomFont;
		string fileName = Application.StartupPath + "\\LabelItem.xml";
		uiDataSet.ReadXml(fileName);
		uiDataSet.AcceptChanges();
	}

	private void FlagDesigner_FormClosed(object sender, FormClosedEventArgs e)
	{
		Validate();
		labelItem_Flag1BindingSource.EndEdit();
		labelItem_Flag2BindingSource.EndEdit();
		labelItem_Flag3BindingSource.EndEdit();
		labelItem_Flag4BindingSource.EndEdit();
		string fileName = Application.StartupPath + "\\LabelItem.xml";
		uiDataSet.WriteXml(fileName);
	}
}
